import argon2 from 'argon2';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { createRemoteJWKSet, SignJWT, jwtVerify } from 'jose';
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
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  verifyRegistrationCodeSchema,
} from '../validators.js';
import { verifyHuman } from '../services/turnstile.service.js';

export const authRouter = Router();

const registrationCodeTtlMs = 10 * 60_000;
const hashRegistrationCode = (userId: string, code: string) =>
  createHmac('sha256', env.JWT_SECRET).update(`${userId}:${code}`).digest('hex');

async function sendRegistrationCode(user: { id: string; email: string; firstName: string }) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const issued = await prisma.user.updateMany({
    where: { id: user.id, emailVerifiedAt: null, deletedAt: null, OR: [
      { emailVerificationExpiresAt: null },
      { emailVerificationExpiresAt: { lte: new Date(Date.now() + registrationCodeTtlMs - 60_000) } },
    ] },
    data: {
      emailVerificationCodeHash: hashRegistrationCode(user.id, code),
      emailVerificationExpiresAt: new Date(Date.now() + registrationCodeTtlMs),
      emailVerificationAttempts: 0,
    },
  });
  if (!issued.count) return;
  try {
    await sendTransactionalEmail({
      to: user.email,
      subject: 'Kodi për verifikimin e llogarisë Rezervo',
      text: `Përshëndetje ${user.firstName}, kodi juaj i verifikimit është ${code}. Kodi skadon pas 10 minutash. Mos e ndani me askënd.`,
    });
  } catch (error) {
    await prisma.user.updateMany({ where: { id: user.id, emailVerificationCodeHash: hashRegistrationCode(user.id, code) }, data: { emailVerificationCodeHash: null, emailVerificationExpiresAt: null } });
    console.error('Registration verification email could not be sent', error);
    throw new AppError(503, 'EMAIL_DELIVERY_FAILED', 'Kodi nuk mund të dërgohet tani. Provoni përsëri pas pak.');
  }
}

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
  reportDeliveryFailure = false,
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
    if (reportDeliveryFailure) throw new AppError(503, 'EMAIL_DELIVERY_FAILED', 'Emaili nuk mund të dërgohet tani. Provoni përsëri pas pak.');
  }
}

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, password, turnstileToken } = req.body;
    await verifyHuman(turnstileToken, req.ip);
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, firstName: true, passwordHash: true, emailVerifiedAt: true, deletedAt: true },
    });
    if (existing?.emailVerifiedAt || existing?.deletedAt)
      throw new AppError(409, 'EMAIL_IN_USE', 'Kjo adresë emaili është tashmë në përdorim.');
    if (existing && (!existing.passwordHash || !(await argon2.verify(existing.passwordHash, password))))
      throw new AppError(409, 'EMAIL_IN_USE', 'Kjo adresë është në përdorim. Hyni ose përdorni rikuperimin e fjalëkalimit.');
    const user = existing
      ? existing
      : await prisma.user.create({
          data: { firstName, lastName, email: email.toLowerCase(), passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
          select: { id: true, email: true, firstName: true, lastName: true, platformRole: true },
        });
    await sendRegistrationCode(user);
    await audit({
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: user.id,
      userId: user.id,
      ip: req.ip,
    });
    res.status(201).json({
      success: true,
      data: { email: user.email, verificationRequired: true },
    });
  }),
);

authRouter.post(
  '/verify-registration-code',
  authLimiter,
  validate(verifyRegistrationCodeSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
    if (
      !user ||
      user.deletedAt ||
      user.emailVerifiedAt ||
      !user.emailVerificationCodeHash ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt <= new Date()
    )
      throw new AppError(422, 'VERIFICATION_EXPIRED', 'Kodi ka skaduar. Regjistrohuni përsëri për kod të ri.');
    if (user.emailVerificationAttempts >= 5)
      throw new AppError(429, 'VERIFICATION_LOCKED', 'Janë bërë shumë prova. Kërkoni kod të ri.');
    const challenge = { id: user.id, emailVerifiedAt: null, deletedAt: null,
      emailVerificationCodeHash: user.emailVerificationCodeHash,
      emailVerificationExpiresAt: { gt: new Date() }, emailVerificationAttempts: { lt: 5 } };
    const attempt = await prisma.user.updateMany({ where: challenge, data: { emailVerificationAttempts: { increment: 1 } } });
    if (!attempt.count) throw new AppError(429, 'VERIFICATION_LOCKED', 'Kodi nuk është më i vlefshëm. Kërkoni kod të ri.');
    const expected = Buffer.from(user.emailVerificationCodeHash, 'hex');
    const actual = Buffer.from(hashRegistrationCode(user.id, req.body.code), 'hex');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new AppError(422, 'INVALID_VERIFICATION_CODE', 'Kodi nuk është i saktë.');
    }
    const consumed = await prisma.user.updateMany({
      where: { ...challenge, emailVerificationAttempts: { lte: 5 } },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationExpiresAt: null,
        emailVerificationAttempts: 0,
      },
    });
    if (!consumed.count) throw new AppError(422, 'VERIFICATION_EXPIRED', 'Kodi është përdorur ose ka skaduar.');
    const verified = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, email: true, firstName: true, lastName: true, platformRole: true } });
    setSessionCookie(res, await createSession(verified.id, verified.platformRole));
    await audit({
      action: 'EMAIL_VERIFIED',
      entity: 'User',
      entityId: verified.id,
      userId: verified.id,
      ip: req.ip,
    });
    res.json({ success: true, data: { user: verified } });
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
    if (!user.emailVerifiedAt) {
      await sendRegistrationCode(user);
      res.json({ success: true, data: { email: user.email, verificationRequired: true } });
      return;
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
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, emailVerifiedAt: new Date(), emailVerificationCodeHash: null, emailVerificationExpiresAt: null, emailVerificationAttempts: 0 } });
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
    if (!user.emailVerifiedAt) await emailAccountLink(user, 'verify-email', true);
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

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
authRouter.post(
  '/google',
  authLimiter,
  validate(googleLoginSchema),
  asyncHandler(async (req, res) => {
    if (!env.GOOGLE_CLIENT_ID)
      throw new AppError(503, 'OAUTH_NOT_CONFIGURED', 'Hyrja me Google nuk është aktivizuar ende.');
    const verified = await jwtVerify(req.body.credential, googleKeys, {
      audience: env.GOOGLE_CLIENT_ID,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });
    const email = typeof verified.payload.email === 'string' ? verified.payload.email.toLowerCase() : '';
    if (!email || verified.payload.email_verified !== true)
      throw new AppError(401, 'GOOGLE_ACCOUNT_INVALID', 'Llogaria Google nuk ka email të verifikuar.');
    const firstName = typeof verified.payload.given_name === 'string' ? verified.payload.given_name : 'Përdorues';
    const lastName = typeof verified.payload.family_name === 'string' ? verified.payload.family_name : 'Google';
    const user = await prisma.user.upsert({
      where: { email },
      update: { emailVerifiedAt: new Date() },
      create: { email, firstName, lastName, emailVerifiedAt: new Date() },
    });
    if (user.deletedAt) throw new AppError(403, 'ACCOUNT_DISABLED', 'Kjo llogari është çaktivizuar.');
    setSessionCookie(res, await createSession(user.id, user.platformRole));
    await audit({ action: 'USER_LOGIN_GOOGLE', entity: 'User', entityId: user.id, userId: user.id, ip: req.ip });
    res.json({ success: true, data: { user: { id: user.id, email, firstName: user.firstName, lastName: user.lastName, platformRole: user.platformRole } } });
  }),
);
