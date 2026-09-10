import { env } from '../config.js';
import { AppError } from '../lib/errors.js';

const baseUrl = () => env.PAYPAL_ENVIRONMENT === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function accessToken() {
  if (env.PAYMENT_PROVIDER !== 'paypal' || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET)
    throw new AppError(503, 'PAYMENTS_NOT_CONFIGURED', 'Pagesat online nuk janë konfiguruar ende.');
  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'PayPal nuk mund të autorizohet tani.');
  return (await response.json() as { access_token: string }).access_token;
}

export function paypalPublicConfig() {
  return env.PAYMENT_PROVIDER === 'paypal' && env.PAYPAL_CLIENT_ID
    ? { enabled: true, clientId: env.PAYPAL_CLIENT_ID, currency: 'EUR' }
    : { enabled: false };
}

export async function createPayPalOrder(input: { amount: string; currency: string; reference: string }) {
  const token = await accessToken();
  const response = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': input.reference },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ reference_id: input.reference, amount: { currency_code: input.currency, value: input.amount } }],
    }),
  });
  if (!response.ok) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'PayPal nuk mund ta krijojë pagesën tani.');
  return await response.json() as { id: string; status: string };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await accessToken();
  const response = await fetch(`${baseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}',
  });
  if (!response.ok) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'PayPal nuk mund ta konfirmojë pagesën tani.');
  return await response.json() as { id: string; status: string };
}
