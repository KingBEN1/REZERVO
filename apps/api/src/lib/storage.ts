import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config.js';
import { AppError } from './errors.js';

export const uploadDirectory = join(process.cwd(), 'uploads');

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

export async function storeBusinessImage(businessId: string, buffer: Buffer) {
  if (env.STORAGE_PROVIDER !== 'local')
    throw new AppError(
      501,
      'STORAGE_NOT_CONFIGURED',
      'Ruajtja e fotove nuk është konfiguruar ende.',
    );
  const extension = imageExtension(buffer);
  if (!extension)
    throw new AppError(415, 'INVALID_IMAGE', 'Ngarkoni një foto JPG, PNG ose WebP të vlefshme.');
  const relativePath = join('business', businessId, `${randomUUID()}.${extension}`);
  const absolutePath = join(uploadDirectory, relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer, { flag: 'wx' });
  return {
    relativePath,
    url: `${env.API_PUBLIC_URL}/uploads/${relativePath.replaceAll('\\', '/')}`,
  };
}

export async function removeLocalImage(url: string) {
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
