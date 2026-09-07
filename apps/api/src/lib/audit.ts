import { prisma } from '../db.js';
import { Prisma } from '@prisma/client';

export function audit(input: {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  businessId?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: { ...input, metadata: input.metadata as Prisma.InputJsonValue | undefined },
  });
}
