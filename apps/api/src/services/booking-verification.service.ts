import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { sendTransactionalEmail } from './email.service.js';
import { env } from '../config.js';

const ttlMs = 10 * 60_000;
const hashCode = (challengeId: string, code: string) =>
  createHash('sha256').update(`${challengeId}:${code}`).digest('hex');

type VerificationChannel = 'EMAIL' | 'SMS';

async function sendSmsCode(phone: string, code: string) {
  const text = `Rezervo: kodi juaj i verifikimit është ${code}. Skadon pas 10 minutash. Mos e ndani me askënd.`;
  if (env.SMS_PROVIDER === 'console') {
    console.info(`[sms:console] To: ${phone}\n${text}`);
    return;
  }
  if (env.SMS_PROVIDER !== 'twilio' || !env.SMS_ACCOUNT_SID || !env.SMS_AUTH_TOKEN || !env.SMS_FROM)
    throw new AppError(503, 'SMS_NOT_CONFIGURED', 'Verifikimi me SMS nuk është aktivizuar ende. Zgjidhni emailin.');
  const token = Buffer.from(`${env.SMS_ACCOUNT_SID}:${env.SMS_AUTH_TOKEN}`).toString('base64');
  const body = new URLSearchParams({ To: phone, From: env.SMS_FROM, Body: text });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.SMS_ACCOUNT_SID}/Messages.json`, {
    method: 'POST', headers: { Authorization: `Basic ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  });
  if (!response.ok) throw new AppError(502, 'SMS_DELIVERY_FAILED', 'SMS nuk mund të dërgohet tani. Provoni emailin.');
}

export async function requestBookingVerification(channel: VerificationChannel, contact: string) {
  const normalizedEmail = channel === 'EMAIL' ? contact.toLowerCase() : '';
  const normalizedPhone = channel === 'SMS' ? contact.replace(/\s+/g, '') : undefined;
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const challenge = await prisma.bookingVerificationChallenge.create({
    data: { email: normalizedEmail, phone: normalizedPhone, channel, codeHash: 'pending', expiresAt: new Date(Date.now() + ttlMs) },
  });
  await prisma.bookingVerificationChallenge.update({
    where: { id: challenge.id },
    data: { codeHash: hashCode(challenge.id, code) },
  });
  if (channel === 'EMAIL') await sendTransactionalEmail({ to: normalizedEmail, subject: 'Kodi për verifikimin e rezervimit', text: `Kodi juaj i verifikimit është: ${code}. Kodi skadon pas 10 minutash. Mos e ndani me askënd.` });
  else await sendSmsCode(normalizedPhone!, code);
  return { challengeId: challenge.id, expiresAt: challenge.expiresAt };
}

export async function confirmBookingEmailVerification(challengeId: string, code: string) {
  const challenge = await prisma.bookingVerificationChallenge.findUnique({ where: { id: challengeId } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date())
    throw new AppError(422, 'VERIFICATION_EXPIRED', 'Kodi ka skaduar. Kërkoni një kod të ri.');
  if (challenge.attempts >= 5)
    throw new AppError(429, 'VERIFICATION_LOCKED', 'Janë bërë shumë prova. Kërkoni një kod të ri.');
  const expected = Buffer.from(challenge.codeHash, 'hex');
  const actual = Buffer.from(hashCode(challengeId, code), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await prisma.bookingVerificationChallenge.update({ where: { id: challengeId }, data: { attempts: { increment: 1 } } });
    throw new AppError(422, 'INVALID_VERIFICATION_CODE', 'Kodi nuk është i saktë.');
  }
  await prisma.bookingVerificationChallenge.update({ where: { id: challengeId }, data: { verifiedAt: new Date() } });
  return { verified: true };
}

export async function consumeBookingVerification(tx: Prisma.TransactionClient, challengeId: string, email: string, phone?: string) {
  const challenge = await tx.bookingVerificationChallenge.findUnique({ where: { id: challengeId } });
  const matches = challenge?.channel === 'SMS' ? challenge.phone === phone?.replace(/\s+/g, '') : challenge?.email === email.toLowerCase();
  if (!challenge || !challenge.verifiedAt || challenge.usedAt || challenge.expiresAt <= new Date() || !matches)
    throw new AppError(422, 'VERIFICATION_REQUIRED', 'Verifikoni emailin ose telefonin para se ta dërgoni rezervimin.');
  const consumed = await tx.bookingVerificationChallenge.updateMany({
    where: { id: challenge.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (!consumed.count) throw new AppError(422, 'VERIFICATION_REQUIRED', 'Kodi i verifikimit është përdorur ose ka skaduar.');
}
