import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/async.js';
import { audit } from '../lib/audit.js';
import { AppError } from '../lib/errors.js';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewBusinessVerificationSchema } from '../validators.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requirePlatformAdmin);

adminRouter.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    const [
      businesses,
      activeBusinesses,
      pendingBusinesses,
      users,
      bookings,
      pendingBookings,
      reviews,
      subscriptions,
    ] = await Promise.all([
      prisma.business.count({ where: { deletedAt: null } }),
      prisma.business.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.business.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.review.count(),
      prisma.subscription.findMany({ where: { status: 'ACTIVE' }, include: { plan: true } }),
    ]);
    const mrr = subscriptions.reduce((sum, item) => sum + Number(item.plan.monthlyPrice), 0);
    res.json({
      success: true,
      data: {
        businesses,
        activeBusinesses,
        pendingBusinesses,
        users,
        bookings,
        pendingBookings,
        reviews,
        mrr,
      },
    });
  }),
);

adminRouter.get(
  '/businesses',
  asyncHandler(async (_req, res) => {
    const businesses = await prisma.business.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        verification: true,
        subscription: { include: { plan: true } },
        _count: { select: { bookings: true, staff: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: { businesses } });
  }),
);

adminRouter.patch(
  '/businesses/:id/verification',
  validate(reviewBusinessVerificationSchema),
  asyncHandler(async (req, res) => {
    const verification = await prisma.businessVerification.findUnique({
      where: { businessId: String(req.params.id) },
      include: { business: { select: { id: true, name: true } } },
    });
    if (!verification)
      throw new AppError(404, 'VERIFICATION_NOT_FOUND', 'Kërkesa e verifikimit nuk u gjet.');
    if (verification.status !== 'SUBMITTED')
      throw new AppError(409, 'VERIFICATION_NOT_PENDING', 'Kjo kërkesë nuk pret kontroll.');
    const updated = await prisma.businessVerification.update({
      where: { id: verification.id },
      data: {
        status: req.body.status,
        reviewNote: req.body.reviewNote || null,
        reviewedAt: new Date(),
        reviewedByUserId: req.auth!.userId,
      },
    });
    if (req.body.status === 'APPROVED') {
      await prisma.business.update({
        where: { id: verification.businessId },
        data: { status: 'ACTIVE' },
      });
    }
    await audit({
      action: `BUSINESS_VERIFICATION_${req.body.status}`,
      entity: 'BusinessVerification',
      entityId: updated.id,
      businessId: verification.businessId,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { verification: updated } });
  }),
);

adminRouter.patch(
  '/businesses/:id/status',
  asyncHandler(async (req, res) => {
    const status = String(req.body.status ?? '');
    if (!['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(status))
      throw new AppError(422, 'INVALID_STATUS', 'Statusi nuk është i vlefshëm.');
    const businessId = String(req.params.id);
    if (status === 'ACTIVE') {
      const verification = await prisma.businessVerification.findUnique({
        where: { businessId },
        select: { status: true },
      });
      if (verification?.status !== 'APPROVED')
        throw new AppError(
          422,
          'VERIFICATION_REQUIRED',
          'Biznesi nuk mund të aktivizohet pa verifikim të miratuar.',
        );
    }
    const business = await prisma.business.update({
      where: { id: businessId },
      data: { status: status as never },
    });
    await audit({
      action: `BUSINESS_${status}`,
      entity: 'Business',
      entityId: business.id,
      businessId: business.id,
      userId: req.auth!.userId,
      ip: req.ip,
    });
    res.json({ success: true, data: { business } });
  }),
);
