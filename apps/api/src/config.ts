import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  API_PUBLIC_URL: z.string().url().default('http://localhost:4000'),
  JWT_SECRET: z.string().min(32),
  COOKIE_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['console', 'resend', 'none']).default('console'),
  EMAIL_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Rezervo <noreply@example.com>'),
  PAYMENT_PROVIDER: z.string().default('none'),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_ENVIRONMENT: z.enum(['sandbox', 'live']).default('sandbox'),
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(24).optional(),
  SMS_PROVIDER: z.enum(['none', 'console', 'twilio', 'smsmode', 'vonage']).default('none'),
  SMSMODE_API_KEY: z.string().optional(),
  SMS_ACCOUNT_SID: z.string().optional(),
  SMS_AUTH_TOKEN: z.string().optional(),
  SMS_FROM: z.string().optional(),
  VONAGE_API_KEY: z.string().optional(),
  VONAGE_API_SECRET: z.string().optional(),
  VONAGE_FROM: z.string().default('Rezervo'),
  WHATSAPP_PROVIDER: z.string().default('none'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const webOrigins = env.WEB_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (
  env.STORAGE_PROVIDER === 'cloudinary' &&
  (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
) {
  throw new Error(
    'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY dhe CLOUDINARY_API_SECRET kërkohen kur STORAGE_PROVIDER=cloudinary.',
  );
}

if (env.NODE_ENV === 'production') {
  const unsafeSecret = /replace-with|dev-secret|ndryshoje-ne-prodhim/i;
  if (unsafeSecret.test(env.JWT_SECRET) || unsafeSecret.test(env.COOKIE_SECRET)) {
    throw new Error('JWT_SECRET dhe COOKIE_SECRET duhet të jenë sekrete unike në prodhim.');
  }
  if (
    !webOrigins.length ||
    webOrigins.some((origin) => !z.string().url().safeParse(origin).success)
  ) {
    throw new Error('WEB_ORIGIN duhet të përmbajë URL-të e lejuara, të ndara me presje.');
  }
  if (!env.API_PUBLIC_URL.startsWith('https://')) {
    throw new Error('API_PUBLIC_URL duhet të përdorë HTTPS në prodhim.');
  }
}
