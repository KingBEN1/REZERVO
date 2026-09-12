import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { sendTransactionalEmail } from './email.service.js';
import { sendTransactionalSms } from './sms.service.js';

const ttlMs = 10 * 60_000;
const hashCode = (challengeId: string, code: string) =>
  createHash('sha256').update(`${challengeId}:${code}`).digest('hex');

type VerificationChannel = 'EMAIL' | 'SMS';

async function sendSmsCode(phone: string, code: string) {
  const text = `Rezervo: kodi juaj i verifikimit është ${code}. Skadon pas 10 minutash. Mos e ndani me askënd.`;
  await sendTransactionalSms(phone, text);
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
