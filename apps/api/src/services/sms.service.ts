import { env } from '../config.js';
import { AppError } from '../lib/errors.js';

export async function sendTransactionalSms(to: string, text: string) {
  if (env.SMS_PROVIDER === 'console') {
    console.info(`[sms:console] To: ${to}\n${text}`);
    return;
  }

  if (env.SMS_PROVIDER === 'smsmode') {
    if (!env.SMSMODE_API_KEY) {
      throw new AppError(503, 'SMS_NOT_CONFIGURED', 'SMSMode API key mungon në konfigurim.');
    }
    const recipient = to.replace(/\D/g, '');
    if (!recipient) {
      throw new AppError(422, 'INVALID_PHONE', 'Numri i telefonit nuk është i vlefshëm.');
    }
    const response = await fetch('https://rest.smsmode.com/sms/v1/messages', {
      signal: AbortSignal.timeout(15_000),
      method: 'POST',
      headers: {
        'X-Api-Key': env.SMSMODE_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ recipient: { to: recipient }, body: { text } }),
    });
    if (!response.ok) {
      console.error('SMSMode delivery failed', response.status, await response.text());
      throw new AppError(
        502,
        'SMS_DELIVERY_FAILED',
        'SMS nuk mund të dërgohet tani. Provoni emailin.',
      );
    }
    return;
  }

  if (env.SMS_PROVIDER === 'vonage') {
    if (!env.VONAGE_API_KEY || !env.VONAGE_API_SECRET) {
      throw new AppError(503, 'SMS_NOT_CONFIGURED', 'Vonage API key ose API secret mungon në konfigurim.');
    }
    const recipient = to.replace(/\D/g, '');
    if (!recipient) {
      throw new AppError(422, 'INVALID_PHONE', 'Numri i telefonit nuk është i vlefshëm.');
    }
    const body = new URLSearchParams({
      api_key: env.VONAGE_API_KEY,
      api_secret: env.VONAGE_API_SECRET,
      to: recipient,
      from: env.VONAGE_FROM,
      text,
      type: 'unicode',
    });
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      signal: AbortSignal.timeout(15_000),
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });
    const result = (await response.json().catch(() => null)) as
      | { messages?: Array<{ status?: string; ['error-text']?: string }> }
      | null;
    const message = result?.messages?.[0];
    if (!response.ok || message?.status !== '0') {
      console.error('Vonage delivery failed', response.status, message?.status, message?.['error-text']);
      throw new AppError(
        502,
        'SMS_DELIVERY_FAILED',
        'SMS nuk mund të dërgohet tani. Provoni emailin.',
      );
    }
    return;
  }

  if (
    env.SMS_PROVIDER === 'twilio' &&
    env.SMS_ACCOUNT_SID &&
    env.SMS_AUTH_TOKEN &&
    env.SMS_FROM
  ) {
    const token = Buffer.from(`${env.SMS_ACCOUNT_SID}:${env.SMS_AUTH_TOKEN}`).toString('base64');
    const body = new URLSearchParams({ To: to, From: env.SMS_FROM, Body: text });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.SMS_ACCOUNT_SID}/Messages.json`,
      {
        signal: AbortSignal.timeout(15_000),
        method: 'POST',
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    if (!response.ok) {
      console.error('Twilio delivery failed', response.status, await response.text());
      throw new AppError(
        502,
        'SMS_DELIVERY_FAILED',
        'SMS nuk mund të dërgohet tani. Provoni emailin.',
      );
    }
    return;
  }

  throw new AppError(
    503,
    'SMS_NOT_CONFIGURED',
    'Verifikimi me SMS nuk është aktivizuar ende. Zgjidhni emailin.',
  );
}
