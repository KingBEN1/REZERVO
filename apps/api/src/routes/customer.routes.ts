import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/async.js';
import { AppError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';

export const customerRouter = Router();
customerRouter.use(requireAuth);

customerRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const customerWhere = { OR: [{ userId: user.id }, { email: user.email }] };
    const [upcoming, past, favorites] = await Promise.all([
      prisma.booking.findMany({
        where: {
          customer: customerWhere,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startAt: { gte: new Date() },
        },
        include: {
          business: { select: { id: true, name: true, slug: true, city: true, coverImage: true } },
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
        orderBy: { startAt: 'asc' },
        take: 20,
      }),
      prisma.booking.findMany({
        where: {
          customer: customerWhere,
          OR: [
            { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
            { endAt: { lt: new Date() } },
          ],
        },
        include: {
          business: { select: { id: true, name: true, slug: true, city: true, coverImage: true } },
          service: { select: { name: true } },
          staff: { select: { name: true } },
        },
        orderBy: { startAt: 'desc' },
        take: 20,
      }),
      prisma.favorite.findMany({
        where: { userId: user.id },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              coverImage: true,
              category: { select: { name: true, slug: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    res.json({
      success: true,
      data: {
        user,
        upcoming,
        past,
        favorites: favorites.map(({ business }) => ({
          ...business,
          rating: business.reviews.length
            ? business.reviews.reduce((total, review) => total + review.rating, 0) /
              business.reviews.length
            : null,
        })),
      },
    });
  }),
);

customerRouter.get(
  '/favorites',
  asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.auth!.userId },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            coverImage: true,
            category: { select: { name: true, slug: true } },
            services: { where: { active: true }, select: { price: true }, take: 1 },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: {
        favorites: favorites.map(({ business }) => ({
          ...business,
          rating: business.reviews.length
            ? business.reviews.reduce((total, review) => total + review.rating, 0) /
              business.reviews.length
            : null,
        })),
      },
    });
  }),
);

customerRouter.post(
  '/favorites/:businessId',
  asyncHandler(async (req, res) => {
    const businessId = String(req.params.businessId);
    const business = await prisma.business.findFirst({
      where: { id: businessId, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError(404, 'BUSINESS_NOT_FOUND', 'Biznesi nuk u gjet.');
    await prisma.favorite.upsert({
      where: { userId_businessId: { userId: req.auth!.userId, businessId } },
      update: {},
      create: { userId: req.auth!.userId, businessId },
    });
    res.status(201).json({ success: true, data: { businessId } });
  }),
);

customerRouter.delete(
  '/favorites/:businessId',
  asyncHandler(async (req, res) => {
    await prisma.favorite.deleteMany({
      where: { userId: req.auth!.userId, businessId: String(req.params.businessId) },
    });
    res.status(204).send();
  }),
);

customerRouter.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      select: { email: true },
    });
    const [favoriteCategories, bookingCategories] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: req.auth!.userId },
        select: { business: { select: { categoryId: true } } },
      }),
      prisma.booking.findMany({
        where: { customer: { OR: [{ userId: req.auth!.userId }, { email: user.email }] } },
        select: { business: { select: { categoryId: true, city: true } } },
        take: 30,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const categoryIds = [
      ...new Set(
        [
          ...favoriteCategories.map((item) => item.business.categoryId),
          ...bookingCategories.map((item) => item.business.categoryId),
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
    const city = bookingCategories[0]?.business.city;
    const businesses = await prisma.business.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        ...(categoryIds.length ? { categoryId: { in: categoryIds } } : {}),
        ...(city ? { city } : {}),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        coverImage: true,
        category: { select: { name: true, slug: true } },
        services: { where: { active: true }, select: { price: true }, take: 1 },
        reviews: { select: { rating: true } },
      },
      take: 8,
    });
    res.json({
      success: true,
      data: {
        recommendations: businesses.map((business) => ({
          ...business,
          rating: business.reviews.length
            ? business.reviews.reduce((total, review) => total + review.rating, 0) /
              business.reviews.length
            : null,
        })),
      },
    });
  }),
);
