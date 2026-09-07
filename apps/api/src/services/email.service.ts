import { env } from '../config.js';

type EmailInput = { to: string; subject: string; text: string };

/**
 * Small provider boundary for transactional email. `console` is deliberately
 * safe for local use; Resend is enabled only when the deployment supplies its
 * own API key.
 */
export async function sendTransactionalEmail({ to, subject, text }: EmailInput) {
  if (env.EMAIL_PROVIDER === 'console') {
    console.info(`[email:console] To: ${to}\nSubject: ${subject}\n${text}`);
    return;
  }
  if (env.EMAIL_PROVIDER !== 'resend') {
    throw new Error('EMAIL_PROVIDER nuk është konfiguruar për dërgim emaili.');
  }
  if (!env.EMAIL_API_KEY) throw new Error('EMAIL_API_KEY mungon për ofruesin Resend.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`Resend nuk e pranoi emailin (${response.status}).`);
}
