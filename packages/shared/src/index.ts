export const PLATFORM_ROLES = ['SUPER_ADMIN', 'SUPPORT_ADMIN'] as const;
export const BUSINESS_ROLES = ['BUSINESS_OWNER', 'MANAGER', 'STAFF'] as const;
export const BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'RESCHEDULED',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type BusinessRole = (typeof BUSINESS_ROLES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
}

export interface PublicBusiness {
  slug: string;
  name: string;
  description: string | null;
  city: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
  coverImage: string | null;
  currency: string;
  timezone: string;
  rating: number;
}
