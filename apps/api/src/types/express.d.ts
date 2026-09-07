import type { BusinessRole, PlatformRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; platformRole: PlatformRole | null };
      tenant?: { businessId: string; role: BusinessRole };
    }
  }
}

export {};
