import { SignJWT, jwtVerify } from 'jose';
import type { RequestHandler } from 'express';
import { env } from '../config.js';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { isPlatformAdmin } from '../lib/permissions.js';

const key = new TextEncoder().encode(env.JWT_SECRET);
const cookieName = 'rezervo_session';

export async function createSession(userId: string, platformRole: string | null) {
  return new SignJWT({ platformRole })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export const setSessionCookie = (res: Parameters<RequestHandler>[1], token: string) => {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const clearSessionCookie = (res: Parameters<RequestHandler>[1]) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

async function readSession(req: Parameters<RequestHandler>[0]) {
  const token = req.cookies?.[cookieName];
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Ju lutemi hyni për të vazhduar.');
  const verified = await jwtVerify(token, key);
  if (!verified.payload.sub) throw new AppError(401, 'UNAUTHENTICATED', 'Sesioni ka skaduar.');
  const user = await prisma.user.findUnique({
    where: { id: verified.payload.sub },
    select: { id: true, platformRole: true, deletedAt: true, updatedAt: true },
  });
  if (!user || user.deletedAt)
    throw new AppError(401, 'UNAUTHENTICATED', 'Sesioni nuk është i vlefshëm.');
  const issuedAt = verified.payload.iat;
  if (typeof issuedAt !== 'number' || (issuedAt + 1) * 1000 < user.updatedAt.getTime()) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sesioni nuk është më i vlefshëm. Hyni përsëri.');
  }
  return { userId: user.id, platformRole: user.platformRole };
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.auth = await readSession(req);
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(401, 'UNAUTHENTICATED', 'Sesioni ka skaduar.'),
    );
  }
};

/** Adds account context to public endpoints without blocking guest visitors. */
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.auth = await readSession(req);
  } catch {
    // Guests and expired sessions may still browse public businesses.
  }
  next();
};

export const requirePlatformAdmin: RequestHandler = (req, _res, next) => {
  if (!req.auth || !isPlatformAdmin(req.auth.platformRole)) {
    next(new AppError(403, 'FORBIDDEN', 'Nuk keni qasje në panelin e administratorit.'));
    return;
  }
  next();
};

export const requireTenant =
  (...allowedRoles: Array<'BUSINESS_OWNER' | 'MANAGER' | 'STAFF'>): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.auth) throw new AppError(401, 'UNAUTHENTICATED', 'Ju lutemi hyni për të vazhduar.');
      const businessId = req.header('x-business-id');
      if (!businessId)
        throw new AppError(400, 'TENANT_REQUIRED', 'Zgjidhni biznesin para se të vazhdoni.');
      const membership = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: req.auth.userId } },
        select: {
          businessId: true,
          role: true,
          business: { select: { status: true, deletedAt: true } },
        },
      });
      if (!membership || membership.business.deletedAt || !allowedRoles.includes(membership.role)) {
        throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Nuk keni qasje në këtë biznes.');
      }
      req.tenant = { businessId: membership.businessId, role: membership.role };
      next();
    } catch (error) {
      next(error);
    }
  };
