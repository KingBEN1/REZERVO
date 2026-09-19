import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { createHmac } from 'node:crypto';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn(),
  sendEmail: vi.fn(), audit: vi.fn(),
}));
vi.mock('../db.js', () => ({ prisma: { user: mocks } }));
vi.mock('../config.js', () => ({ env: { JWT_SECRET: 'test-secret-not-a-real-credential', NODE_ENV: 'test' }, webOrigins: ['http://localhost:5173'] }));
vi.mock('../services/email.service.js', () => ({ sendTransactionalEmail: mocks.sendEmail }));
vi.mock('../services/turnstile.service.js', () => ({ verifyHuman: vi.fn() }));
vi.mock('../lib/audit.js', () => ({ audit: mocks.audit }));
vi.mock('../middleware/rateLimit.js', () => ({ authLimiter: (_req: unknown, _res: unknown, next: () => void) => next() }));
vi.mock('argon2', () => ({ default: { argon2id: 2, hash: async (s: string) => `hash:${s}`, verify: async (h: string, s: string) => h === `hash:${s}` } }));
import { authRouter } from './auth.routes.js';
import { errorHandler } from '../lib/errors.js';

let server: Server;
let base: string;
const email = 'audit@example.test';
const password = 'test-password-123';
const user = () => ({ id: 'audit-user', email, firstName: 'Audit', lastName: 'Test', platformRole: null, passwordHash: `hash:${password}`, deletedAt: null, emailVerifiedAt: null,
  emailVerificationCodeHash: createHmac('sha256', 'test-secret-not-a-real-credential').update('audit-user:123456').digest('hex'),
  emailVerificationExpiresAt: new Date(Date.now() + 600_000), emailVerificationAttempts: 0 });
async function post(path: string, body: unknown) {
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, cookie: response.headers.get('set-cookie'), body: await response.json() };
}
beforeAll(async () => {
  const app = express(); app.use(express.json()); app.use(authRouter); app.use(errorHandler);
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', () => resolve()); });
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => new Promise<void>((resolve, reject) => { server.close((error) => error ? reject(error) : resolve()); server.closeAllConnections(); }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUnique.mockResolvedValue(user()); mocks.findUniqueOrThrow.mockResolvedValue(user());
  mocks.updateMany.mockResolvedValue({ count: 1 }); mocks.sendEmail.mockResolvedValue(undefined);
});
describe('registration and authentication regressions (isolated database/provider mocks)', () => {
  it('does not overwrite an unverified account with a different password', async () => {
    const result = await post('/register', { email, password: 'other-password-123', firstName: 'Other', lastName: 'Person' });
    expect(result.status).toBe(409); expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
  it('resends for the same credentials without changing profile or password', async () => {
    const result = await post('/register', { email, password, firstName: 'Changed', lastName: 'Name' });
    expect(result.status).toBe(201); expect(result.cookie).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.sendEmail).toHaveBeenCalledOnce();
  });
  it('does not resend during the per-account cooldown', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const result = await post('/register', { email, password, firstName: 'Audit', lastName: 'Test' });
    expect(result.status).toBe(201); expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.updateMany.mock.calls[0]![0].where.OR).toHaveLength(2);
  });
  it('lets an unverified user resume OTP through login without a session', async () => {
    const result = await post('/login', { email, password });
    expect(result.status).toBe(200); expect(result.body.data.verificationRequired).toBe(true); expect(result.cookie).toBeNull();
  });
  it('rejects an incorrect login password', async () => {
    expect((await post('/login', { email, password: 'wrong' })).status).toBe(401);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
  it('logs in a verified user', async () => {
    mocks.findUnique.mockResolvedValue({ ...user(), emailVerifiedAt: new Date() });
    const result = await post('/login', { email, password });
    expect(result.status).toBe(200); expect(result.cookie).toContain('rezervo_session=');
  });
  it('issues a session only after an atomic successful OTP consumption', async () => {
    const result = await post('/verify-registration-code', { email, code: '123456' });
    expect(result.status).toBe(200); expect(result.cookie).toContain('rezervo_session=');
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany.mock.calls[1]![0].where.emailVerificationCodeHash).toBe(user().emailVerificationCodeHash);
  });
  it('does not issue a session when another request already consumed the code', async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    const result = await post('/verify-registration-code', { email, code: '123456' });
    expect(result.status).toBe(422); expect(result.cookie).toBeNull();
  });
  it('bounds concurrent attempt reservations', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    expect((await post('/verify-registration-code', { email, code: '123456' })).status).toBe(429);
  });
  it('counts incorrect OTP attempts without verifying the account', async () => {
    const result = await post('/verify-registration-code', { email, code: '999999' });
    expect(result.status).toBe(422); expect(result.cookie).toBeNull(); expect(mocks.updateMany).toHaveBeenCalledOnce();
  });
  it('rejects expired and exhausted challenges', async () => {
    mocks.findUnique.mockResolvedValue({ ...user(), emailVerificationExpiresAt: new Date(0) });
    expect((await post('/verify-registration-code', { email, code: '123456' })).status).toBe(422);
    mocks.findUnique.mockResolvedValue({ ...user(), emailVerificationAttempts: 5 });
    expect((await post('/verify-registration-code', { email, code: '123456' })).status).toBe(429);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
  it('validates malformed codes before database access', async () => {
    expect((await post('/verify-registration-code', { email, code: 'abc' })).status).toBe(422);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
