import type { BusinessRole, PlatformRole } from '@prisma/client';

export const canManageBookings = (role: BusinessRole) =>
  ['BUSINESS_OWNER', 'MANAGER', 'STAFF'].includes(role);
export const canManageBusiness = (role: BusinessRole) => ['BUSINESS_OWNER', 'MANAGER'].includes(role);
export const canManageSubscription = (role: BusinessRole) => role === 'BUSINESS_OWNER';
export const isPlatformAdmin = (role: PlatformRole | null) =>
  role === 'SUPER_ADMIN' || role === 'SUPPORT_ADMIN';
