import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { env } from '../config.js';
import { AppError } from './errors.js';

export const uploadDirectory = join(process.cwd(), 'uploads');

type StoredMedia = { relativePath: string; url: string };

function imageExtension(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
    return 'jpg';
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png';
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return 'webp';
  return undefined;
}

function cloudinarySignature(parameters: Record<string, string | number | boolean>) {
  const secret = env.CLOUDINARY_API_SECRET;
  if (!secret)
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'Cloudinary nuk është konfiguruar.');
  const payload = Object.entries(parameters)
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return createHash('sha1').update(`${payload}${secret}`).digest('hex');
}

async function storeCloudinaryImage(
  businessId: string,
  buffer: Buffer,
  extension: string,
): Promise<StoredMedia> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey)
    throw new AppError(503, 'STORAGE_NOT_CONFIGURED', 'Cloudinary nuk është konfiguruar.');
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `rezervo/business/${businessId}`;
  const parameters = { folder, timestamp };
  const form = new FormData();
  const bytes = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(bytes).set(buffer);
  form.set('file', new Blob([bytes]), `image.${extension}`);
  form.set('folder', folder);
  form.set('timestamp', String(timestamp));
  form.set('api_key', apiKey);
  form.set('signature', cloudinarySignature(parameters));
  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new AppError(
      503,
      'STORAGE_UNAVAILABLE',
      'Nuk u lidhëm me ruajtjen e fotove. Provoni përsëri.',
    );
  }
  const result = (await response.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  } | null;
  if (!response.ok || !result?.secure_url || !result.public_id)
    throw new AppError(
      502,
      'STORAGE_UPLOAD_FAILED',
      result?.error?.message ?? 'Fotoja nuk u ruajt në Cloudinary.',
    );
  return { relativePath: result.public_id, url: result.secure_url };
}

export async function storeBusinessImage(businessId: string, buffer: Buffer): Promise<StoredMedia> {
  const extension = imageExtension(buffer);
  if (!extension)
    throw new AppError(415, 'INVALID_IMAGE', 'Ngarkoni një foto JPG, PNG ose WebP të vlefshme.');
  if (env.STORAGE_PROVIDER === 'cloudinary')
    return storeCloudinaryImage(businessId, buffer, extension);
  if (env.STORAGE_PROVIDER !== 'local')
    throw new AppError(
      501,
      'STORAGE_NOT_CONFIGURED',
      'Ruajtja e fotove nuk është konfiguruar ende.',
    );
  const relativePath = join('business', businessId, `${randomUUID()}.${extension}`);
  const absolutePath = join(uploadDirectory, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer, { flag: 'wx' });
  return {
    relativePath,
    url: `${env.API_PUBLIC_URL}/uploads/${relativePath.replaceAll('\\', '/')}`,
  };
}

function cloudinaryPublicId(url: string) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return undefined;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return undefined;
  const path = decodeURIComponent(url.slice(prefix.length)).replace(/^v\d+\//, '');
  return path.replace(/\.[a-zA-Z0-9]+(?:\?.*)?$/, '');
}

async function removeCloudinaryImage(url: string) {
  const publicId = cloudinaryPublicId(url);
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  if (!publicId || !cloudName || !apiKey) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = { public_id: publicId, timestamp, invalidate: true };
  const form = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    invalidate: 'true',
    api_key: apiKey,
    signature: cloudinarySignature(parameters),
  });
  try {
    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
    });
  } catch {
    /* Do not prevent removing the database record if Cloudinary is temporarily unavailable. */
  }
}

export async function removeStoredImage(url: string) {
  if (env.STORAGE_PROVIDER === 'cloudinary') {
    await removeCloudinaryImage(url);
    return;
  }
  const prefix = `${env.API_PUBLIC_URL}/uploads/`;
  if (!url.startsWith(prefix)) return;
  const relativePath = url.slice(prefix.length);
  if (relativePath.includes('..')) return;
  try {
    await unlink(join(uploadDirectory, relativePath));
  } catch {
    /* The record can still be deleted if a file was already removed. */
  }
}
