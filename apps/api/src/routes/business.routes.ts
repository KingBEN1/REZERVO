import { raw, Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/async.js';
import { audit } from '../lib/audit.js';
import { AppError } from '../lib/errors.js';
import { starterTemplateForCategory } from '../lib/business-templates.js';
import { removeLocalImage, storeBusinessImage } from '../lib/storage.js';
import { requireAuth, requireTenant } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  businessProfileSchema,
  businessSettingsSchema,
  businessVerificationSchema,
  couponSchema,
  createBusinessSchema,
  serviceSchema,
  staffSchema,
  workingHoursSchema,
} from '../validators.js';

export const businessRouter = Router();

businessRouter.post(
  '/',
  requireAuth,
  validate(createBusinessSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const owner = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      select: { emailVerifiedAt: true },
    });
    if (!owner.emailVerifiedAt)
      throw new AppError(
        403,
        'EMAIL_NOT_VERIFIED',
        'Verifikoni emailin e pronarit para se të regjistroni një biznes.',
      );
    const exists = await prisma.business.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (exists) throw new AppError(409, 'SLUG_IN_USE', 'Kjo adresë e biznesit është në përdorim.');
    const [category, monthlyPlan] = await Promise.all([
      prisma.serviceCategory.findFirst({
        where: { id: data.categoryId, active: true },
        select: { id: true, slug: true },
      }),
      prisma.subscriptionPlan.findUnique({ where: { code: 'REZERVO_MONTHLY' } }),
    ]);
    if (!category)
      throw new AppError(422, 'INVALID_CATEGORY', 'Zgjidhni një kategori të vlefshme biznesi.');
    if (!monthlyPlan)
      throw new AppError(
        503,
        'PLANS_UNAVAILABLE',
        'Planet e abonimit nuk janë konfiguruar ende. Ekzekutoni db:seed.',
      );
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 30 * 86400_000);
    const template = starterTemplateForCategory(category.slug);
    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({ data: { ...data, status: 'PENDING' } });
      await tx.businessMember.create({
        data: { businessId: created.id, userId: req.auth!.userId, role: 'BUSINESS_OWNER' },
      });
      await tx.businessSettings.create({ data: { businessId: created.id } });
      await tx.subscription.create({
        data: {
          businessId: created.id,
          planId: monthlyPlan.id,
          status: 'TRIALING',
          provider: 'manual',
          currentPeriodStart: trialStart,
          currentPeriodEnd: trialEnd,
          trialEnd,
        },
      });
      const staff = await tx.staff.create({
        data: {
          businessId: created.id,
          name: template.resourceName,
          position: template.resourceRole,
          capacity: template.capacity,
        },
      });
      const service = await tx.service.create({
        data: {
          businessId: created.id,
          name: template.serviceName,
          description: template.description,
          durationMin: template.durationMin,
          price: template.price,
          priceType: template.priceType,
        },
      });
      await tx.serviceStaff.create({ data: { serviceId: service.id, staffId: staff.id } });
      return created;
    });
    await audit({
      action: 'BUSINESS_CREATED',
      entity: 'Business',
      entityId: business.id,
      businessId: business.id,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: { business } });
  }),
);

businessRouter.get(
  '/current',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: req.tenant!.businessId },
      include: {
        category: { select: { name: true, slug: true } },
        settings: true,
        verification: true,
        subscription: { include: { plan: true } },
        _count: { select: { services: true, staff: true, bookings: true } },
      },
    });
    res.json({ success: true, data: { business, role: req.tenant!.role } });
  }),
);

businessRouter.post(
  '/current/verification',
  requireAuth,
  requireTenant('BUSINESS_OWNER'),
  validate(businessVerificationSchema),
  asyncHandler(async (req, res) => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      select: { emailVerifiedAt: true },
    });
    if (!owner.emailVerifiedAt)
      throw new AppError(403, 'EMAIL_NOT_VERIFIED', 'Verifikoni emailin tuaj para dërgimit.');
    const { confirmAuthority: _authority, confirmAccurate: _accurate, ...data } = req.body;
    const verification = await prisma.businessVerification.upsert({
      where: { businessId: req.tenant!.businessId },
      update: {
        ...data,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
      },
      create: {
        businessId: req.tenant!.businessId,
        ...data,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });
    await audit({
      action: 'BUSINESS_VERIFICATION_SUBMITTED',
      entity: 'BusinessVerification',
      entityId: verification.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { verification } });
  }),
);

businessRouter.patch(
  '/current',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  validate(businessProfileSchema),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const business = await prisma.business.update({
      where: { id: req.tenant!.businessId },
      data: {
        ...data,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        logo: data.logo || null,
        coverImage: data.coverImage || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
    });
    await audit({
      action: 'BUSINESS_PROFILE_UPDATED',
      entity: 'Business',
      entityId: business.id,
      businessId: business.id,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { business } });
  }),
);

businessRouter.get(
  '/images',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const images = await prisma.businessImage.findMany({
      where: { businessId: req.tenant!.businessId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: { images } });
  }),
);

businessRouter.post(
  '/images',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }),
  asyncHandler(async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0)
      throw new AppError(415, 'INVALID_IMAGE', 'Zgjidhni një foto JPG, PNG ose WebP deri në 5 MB.');
    const stored = await storeBusinessImage(req.tenant!.businessId, req.body);
    const image = await prisma.businessImage.create({
      data: {
        businessId: req.tenant!.businessId,
        url: stored.url,
        alt:
          String(req.query.alt ?? '')
            .trim()
            .slice(0, 180) || null,
      },
    });
    await audit({
      action: 'BUSINESS_IMAGE_UPLOADED',
      entity: 'BusinessImage',
      entityId: image.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: { image } });
  }),
);

businessRouter.delete(
  '/images/:id',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const image = await prisma.businessImage.findFirst({
      where: { id: String(req.params.id), businessId: req.tenant!.businessId },
    });
    if (!image) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Fotoja nuk u gjet.');
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: req.tenant!.businessId },
      select: { logo: true, coverImage: true },
    });
    await prisma.$transaction(async (tx) => {
      await tx.businessImage.delete({ where: { id: image.id } });
      if (business.logo === image.url || business.coverImage === image.url) {
        await tx.business.update({
          where: { id: req.tenant!.businessId },
          data: {
            ...(business.logo === image.url ? { logo: null } : {}),
            ...(business.coverImage === image.url ? { coverImage: null } : {}),
          },
        });
      }
    });
    await removeLocalImage(image.url);
    await audit({
      action: 'BUSINESS_IMAGE_DELETED',
      entity: 'BusinessImage',
      entityId: image.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.status(204).send();
  }),
);

businessRouter.patch(
  '/current/settings',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  validate(businessSettingsSchema),
  asyncHandler(async (req, res) => {
    const settings = await prisma.businessSettings.upsert({
      where: { businessId: req.tenant!.businessId },
      update: req.body,
      create: { businessId: req.tenant!.businessId, ...req.body },
    });
    await audit({
      action: 'BUSINESS_SETTINGS_UPDATED',
      entity: 'BusinessSettings',
      entityId: settings.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { settings } });
  }),
);

businessRouter.get(
  '/coupons',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const coupons = await prisma.coupon.findMany({
      where: { businessId: req.tenant!.businessId },
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: { coupons } });
  }),
);

businessRouter.post(
  '/coupons',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  validate(couponSchema),
  asyncHandler(async (req, res) => {
    const coupon = await prisma.coupon.upsert({
      where: { businessId_code: { businessId: req.tenant!.businessId, code: req.body.code } },
      update: {
        percentOff: req.body.percentOff ?? null,
        amountOff: req.body.amountOff ?? null,
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : null,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
        active: true,
      },
      create: {
        businessId: req.tenant!.businessId,
        code: req.body.code,
        percentOff: req.body.percentOff,
        amountOff: req.body.amountOff,
        startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
        endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined,
      },
    });
    await audit({
      action: 'COUPON_SAVED',
      entity: 'Coupon',
      entityId: coupon.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: { coupon } });
  }),
);

businessRouter.delete(
  '/coupons/:id',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const deleted = await prisma.coupon.deleteMany({
      where: { id: String(req.params.id), businessId: req.tenant!.businessId },
    });
    if (!deleted.count) throw new AppError(404, 'COUPON_NOT_FOUND', 'Kodi promocional nuk u gjet.');
    res.status(204).send();
  }),
);

businessRouter.get(
  '/hours',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const hours = await prisma.workingHours.findMany({
      where: { businessId: req.tenant!.businessId, staffId: null },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json({ success: true, data: { hours } });
  }),
);

businessRouter.put(
  '/hours',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  validate(workingHoursSchema),
  asyncHandler(async (req, res) => {
    const hours = req.body.hours.filter((item: { isOpen: boolean }) => item.isOpen);
    await prisma.$transaction(async (tx) => {
      await tx.workingHours.deleteMany({
        where: { businessId: req.tenant!.businessId, staffId: null },
      });
      await tx.workingHours.createMany({
        data: hours.map((item: { dayOfWeek: number; startTime: string; endTime: string }) => ({
          businessId: req.tenant!.businessId,
          ...item,
        })),
      });
    });
    await audit({
      action: 'BUSINESS_HOURS_UPDATED',
      entity: 'WorkingHours',
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { hours } });
  }),
);

businessRouter.patch(
  '/current/publish',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  asyncHandler(async (req, res) => {
    const [services, staff, hours, verification] = await Promise.all([
      prisma.service.count({ where: { businessId: req.tenant!.businessId, active: true } }),
      prisma.staff.count({ where: { businessId: req.tenant!.businessId, active: true } }),
      prisma.workingHours.count({
        where: { businessId: req.tenant!.businessId, staffId: null, isOpen: true },
      }),
      prisma.businessVerification.findUnique({
        where: { businessId: req.tenant!.businessId },
        select: { status: true },
      }),
    ]);
    const missing = [
      !services && 'të paktën një ofertë',
      !staff && 'të paktën një anëtar ekipi ose burim',
      !hours && 'orar pune',
    ].filter(Boolean);
    if (missing.length)
      throw new AppError(422, 'SETUP_INCOMPLETE', `Para publikimit, shtoni ${missing.join(', ')}.`);
    if (verification?.status !== 'APPROVED')
      throw new AppError(
        422,
        'VERIFICATION_REQUIRED',
        'Dërgoni të dhënat e verifikimit. Faqja aktivizohet vetëm pasi administratori ta miratojë biznesin.',
      );
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: req.tenant!.businessId },
    });
    await audit({
      action: 'BUSINESS_PUBLICATION_REQUESTED',
      entity: 'Business',
      entityId: business.id,
      businessId: business.id,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({
      success: true,
      data: {
        business,
        message: 'Biznesi është verifikuar dhe pret aktivizimin nga administratori.',
      },
    });
  }),
);

businessRouter.get(
  '/services',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const services = await prisma.service.findMany({
      where: { businessId: req.tenant!.businessId },
      include: { staff: { include: { staff: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { services } });
  }),
);

businessRouter.post(
  '/services',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  validate(serviceSchema),
  asyncHandler(async (req, res) => {
    const { staffIds, ...data } = req.body;
    const verifiedStaff = await prisma.staff.count({
      where: { id: { in: staffIds }, businessId: req.tenant!.businessId, active: true },
    });
    if (verifiedStaff !== staffIds.length)
      throw new AppError(
        422,
        'INVALID_STAFF',
        'Një ose më shumë anëtarë stafi nuk janë të vlefshëm.',
      );
    const service = await prisma.service.create({
      data: {
        businessId: req.tenant!.businessId,
        ...data,
        staff: { create: staffIds.map((staffId: string) => ({ staffId })) },
      },
      include: { staff: { include: { staff: true } } },
    });
    await audit({
      action: 'SERVICE_CREATED',
      entity: 'Service',
      entityId: service.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: { service } });
  }),
);

businessRouter.get(
  '/staff',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findMany({
      where: { businessId: req.tenant!.businessId },
      include: { services: { include: { service: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { staff } });
  }),
);

businessRouter.post(
  '/staff',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER'),
  validate(staffSchema),
  asyncHandler(async (req, res) => {
    const staff = await prisma.staff.create({
      data: { businessId: req.tenant!.businessId, ...req.body },
    });
    await audit({
      action: 'STAFF_CREATED',
      entity: 'Staff',
      entityId: staff.id,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.status(201).json({ success: true, data: { staff } });
  }),
);

businessRouter.get(
  '/bookings',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId: req.tenant!.businessId },
        include: { customer: true, service: true, staff: true, payment: true },
        orderBy: { startAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where: { businessId: req.tenant!.businessId } }),
    ]);
    res.json({ success: true, data: { bookings, page, limit, total } });
  }),
);

businessRouter.get(
  '/customers',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
    const search = String(req.query.q ?? '').trim();
    const where = {
      businessId: req.tenant!.businessId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { bookings: { select: { status: true, price: true, startAt: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);
    res.json({ success: true, data: { customers, page, limit, total } });
  }),
);

businessRouter.patch(
  '/bookings/:id/status',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const status = String(req.body.status ?? '');
    if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status))
      throw new AppError(422, 'INVALID_STATUS', 'Statusi nuk është i vlefshëm.');
    const bookingId = String(req.params.id);
    const booking = await prisma.booking.updateMany({
      where: { id: bookingId, businessId: req.tenant!.businessId },
      data: {
        status: status as never,
        ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
      },
    });
    if (!booking.count) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Rezervimi nuk u gjet.');
    await audit({
      action: `BOOKING_${status}`,
      entity: 'Booking',
      entityId: bookingId,
      businessId: req.tenant!.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { id: bookingId, status } });
  }),
);

businessRouter.get(
  '/dashboard',
  requireAuth,
  requireTenant('BUSINESS_OWNER', 'MANAGER', 'STAFF'),
  asyncHandler(async (req, res) => {
    const businessId = req.tenant!.businessId;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const week = new Date(today);
    week.setUTCDate(week.getUTCDate() + 7);
    const [todayBookings, upcoming, customerCount, revenue] = await Promise.all([
      prisma.booking.count({
        where: {
          businessId,
          startAt: { gte: today, lt: week },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      }),
      prisma.booking.findMany({
        where: {
          businessId,
          startAt: { gte: new Date() },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        take: 5,
        orderBy: { startAt: 'asc' },
        include: { service: true, customer: true, staff: true, payment: true },
      }),
      prisma.customer.count({ where: { businessId, deletedAt: null } }),
      prisma.booking.aggregate({
        where: { businessId, status: 'COMPLETED', startAt: { gte: today } },
        _sum: { price: true },
      }),
    ]);
    res.json({
      success: true,
      data: { todayBookings, upcoming, customerCount, revenue: revenue._sum.price ?? 0 },
    });
  }),
);
