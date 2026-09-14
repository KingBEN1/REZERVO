import { env } from '../config.js';
import { AppError } from '../lib/errors.js';

export async function verifyHuman(token: string | undefined, remoteip?: string) {
  if (!env.TURNSTILE_SECRET_KEY) return;
  if (!token) throw new AppError(422, 'HUMAN_VERIFICATION_REQUIRED', 'Konfirmoni që nuk jeni robot.');
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (remoteip) body.set('remoteip', remoteip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const result = (await response.json()) as { success?: boolean };
  if (!response.ok || !result.success)
    throw new AppError(422, 'HUMAN_VERIFICATION_FAILED', 'Verifikimi kundër robotëve dështoi. Provojeni përsëri.');
}
