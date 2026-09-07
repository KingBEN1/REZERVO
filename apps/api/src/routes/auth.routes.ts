import argon2 from 'argon2';
import { createHmac } from 'node:crypto';
import { Router } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { env, webOrigins } from '../config.js';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/async.js';
import { audit } from '../lib/audit.js';
import { AppError } from '../lib/errors.js';
import {
  clearSessionCookie,
  createSession,
  requireAuth,
  setSessionCookie,
} from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { sendTransactionalEmail } from '../services/email.service.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators.js';

export const authRouter = Router();

const accountTokenKey = (passwordHash: string) =>
  new TextEncoder().encode(createHmac('sha256', env.JWT_SECRET).update(passwordHash).digest('hex'));

async function createAccountToken(
  user: { id: string; passwordHash: string },
  purpose: 'password-reset' | 'verify-email',
) {
  return new SignJWT({ purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(purpose === 'password-reset' ? '1h' : '24h')
    .sign(accountTokenKey(user.passwordHash));
}

async function readAccountToken(token: string, purpose: 'password-reset' | 'verify-email') {
  const unsafePayload = token.split('.')[1];
  if (!unsafePayload)
    throw new AppError(400, 'INVALID_TOKEN', 'Lidhja nuk është e vlefshme ose ka skaduar.');
  let subject: string | undefined;
  try {
    subject = JSON.parse(Buffer.from(unsafePayload, 'base64url').toString('utf8')).sub;
  } catch {
    throw new AppError(400, 'INVALID_TOKEN', 'Lidhja nuk është e vlefshme ose ka skaduar.');
  }
  if (!subject)
    throw new AppError(400, 'INVALID_TOKEN', 'Lidhja nuk është e vlefshme ose ka skaduar.');
  const user = await prisma.user.findUnique({ where: { id: subject } });
  if (!user?.passwordHash || user.deletedAt)
    throw new AppError(400, 'INVALID_TOKEN', 'Lidhja nuk është e vlefshme ose ka skaduar.');
  try {
    const verified = await jwtVerify(token, accountTokenKey(user.passwordHash));
    if (verified.payload.sub !== user.id || verified.payload.purpose !== purpose)
      throw new Error('Purpose mismatch');
  } catch {
    throw new AppError(400, 'INVALID_TOKEN', 'Lidhja nuk është e vlefshme ose ka skaduar.');
  }
  return user;
}

async function emailAccountLink(
  user: { id: string; email: string; firstName: string; passwordHash: string | null },
  purpose: 'password-reset' | 'verify-email',
) {
  if (!user.passwordHash) return;
  const token = await createAccountToken({ id: user.id, passwordHash: user.passwordHash }, purpose);
  const baseUrl = webOrigins[0] ?? env.WEB_ORIGIN;
  const path = purpose === 'password-reset' ? '/reset-password' : '/verify-email';
  const link = `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
  const subject =
    purpose === 'password-reset'
      ? 'Rivendosni fjalëkalimin e Rezervo'
      : 'Verifikoni emailin tuaj në Rezervo';
  const text =
    purpose === 'password-reset'
      ? `Përshëndetje ${user.firstName}, hapni këtë lidhje për të vendosur një fjalëkalim të ri. Ajo vlen për 1 orë: ${link}`
      : `Përshëndetje ${user.firstName}, verifikoni emailin tuaj duke hapur këtë lidhje brenda 24 orëve: ${link}`;
  try {
    await sendTransactionalEmail({ to: user.email, subject, text });
  } catch (error) {
    console.error(`Account ${purpose} email could not be sent`, error);
  }
}

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    const exists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (exists)
      throw new AppError(409, 'EMAIL_IN_USE', 'Kjo adresë emaili është tashmë në përdorim.');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await prisma.user.create({
      data: { firstName, lastName, email: email.toLowerCase(), passwordHash },
      select: { id: true, email: true, firstName: true, lastName: true, platformRole: true },
    });
    const token = await createSession(user.id, user.platformRole);
    setSessionCookie(res, token);
    await audit({
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ip: req.ip,
    });
    await emailAccountLink({ ...user, passwordHash }, 'verify-email');
    res.status(201).json({ success: true, data: { user } });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (
      !user?.passwordHash ||
      user.deletedAt ||
      !(await argon2.verify(user.passwordHash, password))
    ) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Emaili ose fjalëkalimi nuk është i saktë.');
    }
    const token = await createSession(user.id, user.platformRole);
    setSessionCookie(res, token);
    await audit({
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ip: req.ip,
    });
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          platformRole: user.platformRole,
        },
      },
    });
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      select: { id: true, email: true, firstName: true, passwordHash: true, deletedAt: true },
    });
    if (user && !user.deletedAt) await emailAccountLink(user, 'password-reset');
    res.json({
      success: true,
      data: { message: 'Nëse emaili ekziston, lidhja e rikuperimit është dërguar.' },
    });
  }),
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const user = await readAccountToken(req.body.token, 'password-reset');
    const passwordHash = await argon2.hash(req.body.password, { type: argon2.argon2id });
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    const refreshed = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { id: true, platformRole: true },
    });
    const session = await createSession(refreshed.id, refreshed.platformRole);
    setSessionCookie(res, session);
    await audit({
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ip: req.ip,
    });
    res.json({ success: true, data: { message: 'Fjalëkalimi u ndryshua me sukses.' } });
  }),
);

authRouter.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const user = await readAccountToken(req.body.token, 'verify-email');
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    await audit({
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ip: req.ip,
    });
    res.json({ success: true, data: { message: 'Emaili u verifikua me sukses.' } });
  }),
);

authRouter.post(
  '/resend-verification',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      select: { id: true, email: true, firstName: true, passwordHash: true, emailVerifiedAt: true },
    });
    if (!user.emailVerifiedAt) await emailAccountLink(user, 'verify-email');
    res.json({
      success: true,
      data: { message: 'Nëse nevojitet, lidhja e verifikimit është dërguar.' },
    });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.auth!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        platformRole: true,
        emailVerifiedAt: true,
        memberships: {
          include: { business: { select: { id: true, name: true, slug: true, status: true } } },
        },
      },
    });
    res.json({ success: true, data: { user } });
  }),
);

// OAuth is intentionally an explicit adapter boundary, not a pretend sign-in button.
authRouter.get('/google', (_req, _res, next) =>
  next(new AppError(501, 'OAUTH_NOT_CONFIGURED', 'Google hyrja nuk është konfiguruar ende.')),
);
