import { randomBytes } from 'node:crypto';

export function bookingReference() {
  return `KR-${new Date().getUTCFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}
