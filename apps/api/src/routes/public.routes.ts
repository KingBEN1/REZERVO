import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/async.js';
import { AppError } from '../lib/errors.js';
import { bookingLimiter, bookingVerificationLimiter, publicApiLimiter } from '../middleware/rateLimit.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  accommodationAvailabilitySchema,
  availabilitySchema,
  cancelManagedBookingSchema,
  createReviewSchema,
  manageBookingTokenSchema,
  publicBookingSchema,
  rescheduleManagedBookingSchema,
  bookingVerificationConfirmSchema,
  bookingVerificationRequestSchema,
} from '../validators.js';
import { createPublicBooking } from '../services/booking.service.js';
import { getPublicAvailability } from '../services/availability.service.js';
import { confirmBookingEmailVerification, requestBookingVerification } from '../services/booking-verification.service.js';
import { capturePayPalOrder, createPayPalOrder, paypalPublicConfig } from '../services/paypal.service.js';
import { notifyBookingEvent } from '../services/notification.service.js';
import {
  cancelManagedBooking,
  createManagedBookingReview,
  getManagedBookingDetails,
  rescheduleManagedBooking,
} from '../services/managed-booking.service.js';

export const publicRouter = Router();
publicRouter.use(publicApiLimiter);

publicRouter.get('/payments/paypal/config', (_req, res) => {
  res.json({ success: true, data: paypalPublicConfig() });
});

publicRouter.post(
  '/payments/paypal/order',
  bookingLimiter,
  asyncHandler(async (req, res) => {
    const manageToken = String(req.body.manageToken ?? '');
    const booking = await prisma.booking.findUnique({ where: { manageToken }, include: { payment: true } });
    if (!booking?.payment || booking.payment.status !== 'PENDING')
      throw new AppError(422, 'PAYMENT_NOT_AVAILABLE', 'Kjo pagesë nuk është e disponueshme.');
    const order = await createPayPalOrder({
      amount: booking.payment.amount.toFixed(2), currency: booking.payment.currency, reference: booking.reference,
    });
    await prisma.payment.update({ where: { id: booking.payment.id }, data: { providerPaymentId: order.id } });
    res.status(201).json({ success: true, data: { orderId: order.id } });
  }),
);

publicRouter.post(
  '/payments/paypal/capture',
  bookingLimiter,
  asyncHandler(async (req, res) => {
    const manageToken = String(req.body.manageToken ?? '');
    const orderId = String(req.body.orderId ?? '');
    const booking = await prisma.booking.findUnique({
      where: { manageToken }, include: { payment: true, business: { include: { settings: true } } },
    });
    if (!booking?.payment || booking.payment.status !== 'PENDING' || booking.payment.providerPaymentId !== orderId)
      throw new AppError(422, 'PAYMENT_NOT_AVAILABLE', 'Pagesa nuk përputhet me rezervimin.');
    const captured = await capturePayPalOrder(orderId);
    if (captured.status !== 'COMPLETED') throw new AppError(422, 'PAYMENT_NOT_COMPLETED', 'Pagesa nuk u përfundua.');
    await prisma.$transaction([
      prisma.payment.update({ where: { id: booking.payment.id }, data: { status: 'PAID' } }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: booking.business.settings?.requireApproval ? 'PENDING' : 'CONFIRMED' },
      }),
    ]);
    await notifyBookingEvent(booking.id, 'confirmed');
    res.json({ success: true, data: { paid: true } });
  }),
);

publicRouter.post(
  '/booking-verification/request',
  bookingVerificationLimiter,
  validate(bookingVerificationRequestSchema),
  asyncHandler(async (req, res) => {
    const verification = await requestBookingVerification(req.body.channel, req.body.contact);
    res.status(201).json({ success: true, data: verification });
  }),
);

publicRouter.post(
  '/booking-verification/confirm',
  bookingVerificationLimiter,
  validate(bookingVerificationConfirmSchema),
  asyncHandler(async (req, res) => {
    const result = await confirmBookingEmailVerification(req.body.challengeId, req.body.code);
    res.json({ success: true, data: result });
  }),
);

publicRouter.get(
  '/plans',
  asyncHandler(async (_req, res) => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      select: {
        code: true,
        name: true,
        description: true,
        monthlyPrice: true,
        annualPrice: true,
        limits: true,
        features: true,
      },
      orderBy: { monthlyPrice: 'asc' },
    });
    res.json({ success: true, data: { plans } });
  }),
);

publicRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.serviceCategory.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { categories } });
  }),
);

publicRouter.get(
  '/bookings/manage/:token',
  validate(manageBookingTokenSchema),
  asyncHandler(async (req, res) => {
    const booking = await getManagedBookingDetails(String(req.params.token));
    res.json({ success: true, data: { booking } });
  }),
);

publicRouter.post(
  '/bookings/manage/:token/cancel',
  validate(cancelManagedBookingSchema),
  asyncHandler(async (req, res) => {
    const booking = await cancelManagedBooking(String(req.params.token), req.body.reason);
    res.json({ success: true, data: { booking } });
  }),
);

publicRouter.post(
  '/bookings/manage/:token/reschedule',
  validate(rescheduleManagedBookingSchema),
  asyncHandler(async (req, res) => {
    const booking = await rescheduleManagedBooking(
      String(req.params.token),
      new Date(req.body.startAt),
    );
    res.json({ success: true, data: { booking } });
  }),
);

publicRouter.post(
  '/bookings/manage/:token/review',
  validate(createReviewSchema),
  asyncHandler(async (req, res) => {
    const review = await createManagedBookingReview(
      String(req.params.token),
      req.body.rating,
      req.body.comment,
    );
    res.status(201).json({ success: true, data: { review } });
  }),
);

publicRouter.get(
  '/businesses',
  asyncHandler(async (req, res) => {
    const query = String(req.query.q ?? '').trim();
    const city = String(req.query.city ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const minPrice = Math.max(0, Number(req.query.minPrice ?? 0) || 0);
    const maxPrice = Math.max(0, Number(req.query.maxPrice ?? 0) || 0);
    const minRating = Math.min(5, Math.max(0, Number(req.query.minRating ?? 0) || 0));
    const sort = String(req.query.sort ?? 'recommended');
    const checkIn = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.checkIn ?? ''))
      ? new Date(`${req.query.checkIn}T12:00:00.000Z`)
      : undefined;
    const checkOut = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.checkOut ?? ''))
      ? new Date(`${req.query.checkOut}T12:00:00.000Z`)
      : undefined;
    const guests = Math.max(1, Number(req.query.guests ?? 1) || 1);
    const hasStayDates = Boolean(checkIn && checkOut && checkOut > checkIn);
    const businesses = await prisma.business.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
        ...(category ? { category: { slug: category } } : {}),
        ...(minPrice || maxPrice
          ? {
              services: {
                some: {
                  active: true,
                  price: {
                    ...(minPrice ? { gte: minPrice } : {}),
                    ...(maxPrice ? { lte: maxPrice } : {}),
                  },
                },
              },
            }
          : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { category: { name: { contains: query, mode: 'insensitive' } } },
                {
                  services: {
                    some: { name: { contains: query, mode: 'insensitive' }, active: true },
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        slug: true,
        name: true,
        city: true,
        logo: true,
        coverImage: true,
        category: { select: { name: true, slug: true } },
        services: {
          where: { active: true },
          select: { price: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
        staff: {
          where: { active: true },
          select: {
            id: true,
            capacity: true,
            bookings: {
              where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
                ...(hasStayDates
                  ? { bufferStartAt: { lt: checkOut }, bufferEndAt: { gt: checkIn } }
                  : {}),
              },
              select: { id: true },
            },
          },
        },
        reviews: { select: { rating: true } },
      },
      take: 60,
    });
    const result = businesses
      .map((item) => {
        const rating = item.reviews.length
          ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length
          : null;
        const availableUnits =
          item.category?.slug === 'hotels' && hasStayDates
            ? item.staff.filter((staff) => staff.capacity >= guests && staff.bookings.length === 0)
                .length
            : undefined;
        return { ...item, rating, availableUnits, staff: undefined };
      })
      .filter((item) => (minRating ? (item.rating ?? 0) >= minRating : true))
      .filter(
        (item) => item.category?.slug !== 'hotels' || !hasStayDates || Boolean(item.availableUnits),
      );
    result.sort((left, right) =>
      sort === 'price-low'
        ? Number(left.services[0]?.price ?? 0) - Number(right.services[0]?.price ?? 0)
        : sort === 'rating'
          ? (right.rating ?? 0) - (left.rating ?? 0)
          : (right.rating ?? 0) - (left.rating ?? 0),
    );
    res.json({
      success: true,
      data: { businesses: result.slice(0, 30) },
    });
  }),
);

publicRouter.get(
  '/businesses/:slug',
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findFirst({
      where: { slug: String(req.params.slug), status: 'ACTIVE', deletedAt: null },
      include: {
        category: true,
        services: { where: { active: true }, include: { staff: { include: { staff: true } } } },
        staff: { where: { active: true } },
        workingHours: { where: { staffId: null }, orderBy: { dayOfWeek: 'asc' } },
        reviews: {
          where: { moderatedAt: null },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { rating: true, comment: true, createdAt: true },
        },
        settings: {
          select: {
            primaryColor: true,
            requireApproval: true,
            allowGuestBooking: true,
            minNoticeMinutes: true,
            maxBookingDays: true,
            cancellationDeadlineMin: true,
            reschedulingEnabled: true,
            requirePrepayment: true,
            depositPercent: true,
          },
        },
      },
    });
    if (!business) throw new AppError(404, 'BUSINESS_NOT_FOUND', 'Biznesi nuk u gjet.');
    res.json({ success: true, data: { business } });
  }),
);

publicRouter.get(
  '/businesses/:slug/availability',
  validate(availabilitySchema),
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findFirst({
      where: { slug: String(req.params.slug), status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError(404, 'BUSINESS_NOT_FOUND', 'Biznesi nuk u gjet.');
    const slots = await getPublicAvailability({
      businessId: business.id,
      serviceId: String(req.query.serviceId),
      staffId: String(req.query.staffId),
      date: String(req.query.date),
    });
    res.json({
      success: true,
      data: {
        slots: slots.map((slot) => ({
          startAt: slot.start.toISOString(),
          endAt: slot.end.toISOString(),
        })),
      },
    });
  }),
);

publicRouter.get(
  '/businesses/:slug/accommodation-availability',
  validate(accommodationAvailabilitySchema),
  asyncHandler(async (req, res) => {
    const checkInDate = new Date(`${req.query.checkInDate}T12:00:00.000Z`);
    const checkOutDate = new Date(`${req.query.checkOutDate}T12:00:00.000Z`);
    if (checkOutDate <= checkInDate)
      throw new AppError(422, 'INVALID_DATES', 'Data e daljes duhet të jetë pas datës së hyrjes.');
    const business = await prisma.business.findFirst({
      where: { slug: String(req.params.slug), status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError(404, 'BUSINESS_NOT_FOUND', 'Biznesi nuk u gjet.');
    const staff = await prisma.staff.findFirst({
      where: {
        id: String(req.query.staffId),
        businessId: business.id,
        active: true,
        capacity: { gte: Number(req.query.guestCount) },
        services: { some: { serviceId: String(req.query.serviceId) } },
      },
      select: { id: true },
    });
    if (!staff) return res.json({ success: true, data: { available: false } });
    const conflict = await prisma.booking.findFirst({
      where: {
        staffId: staff.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        bufferStartAt: { lt: checkOutDate },
        bufferEndAt: { gt: checkInDate },
      },
      select: { id: true },
    });
    res.json({ success: true, data: { available: !conflict } });
  }),
);

publicRouter.post(
  '/businesses/:slug/bookings',
  bookingLimiter,
  optionalAuth,
  validate(publicBookingSchema),
  asyncHandler(async (req, res) => {
    const booking = await createPublicBooking({
      slug: String(req.params.slug),
      ...req.body,
      customerUserId: req.auth?.userId,
      ...(req.body.startAt ? { startAt: new Date(req.body.startAt) } : {}),
    });
    res.status(201).json({ success: true, data: { booking } });
  }),
);
