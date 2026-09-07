import { addMinutes } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { runtimeTimezone } from '../lib/timezone.js';
import { getPublicAvailability } from './availability.service.js';
import { notifyBookingEvent } from './notification.service.js';

const activeStatuses = ['PENDING', 'CONFIRMED'] as const;

function zonedIsoDate(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: runtimeTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

async function getManagedBooking(token: string) {
  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: {
      business: { include: { settings: true } },
      service: true,
      staff: true,
      customer: true,
      review: true,
    },
  });
  if (!booking)
    throw new AppError(
      404,
      'BOOKING_NOT_FOUND',
      'Rezervimi nuk u gjet. Kontrolloni lidhjen që keni hapur.',
    );
  return booking;
}

function assertCanChange(booking: Awaited<ReturnType<typeof getManagedBooking>>) {
  if (!activeStatuses.includes(booking.status as (typeof activeStatuses)[number])) {
    throw new AppError(409, 'BOOKING_NOT_CHANGEABLE', 'Ky rezervim nuk mund të ndryshohet më.');
  }
  const deadline = new Date(
    booking.startAt.getTime() -
      (booking.business.settings?.cancellationDeadlineMin ?? 120) * 60_000,
  );
  if (new Date() > deadline)
    throw new AppError(
      409,
      'CANCELLATION_DEADLINE_PASSED',
      'Afati për ndryshim ose anulim ka kaluar. Kontaktoni biznesin drejtpërdrejt.',
    );
}

export async function getManagedBookingDetails(token: string) {
  return getManagedBooking(token);
}

export async function cancelManagedBooking(token: string, reason?: string) {
  const booking = await getManagedBooking(token);
  assertCanChange(booking);
  const cancelled = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      cancellationNote: reason || 'Anuluar nga klienti',
      cancelledAt: new Date(),
    },
    include: { business: true, service: true, staff: true, customer: true },
  });
  await notifyBookingEvent(booking.id, 'cancelled');
  return cancelled;
}

export async function rescheduleManagedBooking(token: string, startAt: Date) {
  try {
    const booking = await getManagedBooking(token);
    assertCanChange(booking);
    if (booking.kind === 'ACCOMMODATION')
      throw new AppError(
        409,
        'RESCHEDULING_DISABLED',
        'Për akomodim, kontaktoni biznesin për ndryshimin e datave ose dhomës.',
      );
    if (!booking.business.settings?.reschedulingEnabled)
      throw new AppError(
        409,
        'RESCHEDULING_DISABLED',
        'Ky biznes nuk lejon ndryshim online të terminit.',
      );
    if (booking.startAt.getTime() === startAt.getTime()) return booking;
    const date = zonedIsoDate(startAt, booking.business.timezone);
    const slots = await getPublicAvailability({
      businessId: booking.businessId,
      serviceId: booking.serviceId,
      staffId: booking.staffId,
      date,
      ignoreBookingId: booking.id,
    });
    if (!slots.some((slot) => slot.start.getTime() === startAt.getTime()))
      throw new AppError(
        409,
        'BOOKING_UNAVAILABLE',
        'Koha e zgjedhur nuk është e lirë. Provoni një orar tjetër.',
      );
    const endAt = addMinutes(startAt, booking.service.durationMin);
    const bufferStartAt = addMinutes(startAt, -booking.service.bufferBefore);
    const bufferEndAt = addMinutes(endAt, booking.service.bufferAfter);
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: { startAt, endAt, bufferStartAt, bufferEndAt },
      include: { business: true, service: true, staff: true, customer: true, review: true },
    });
    await notifyBookingEvent(booking.id, 'rescheduled');
    return updated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2004'
    ) {
      throw new AppError(
        409,
        'BOOKING_UNAVAILABLE',
        'Koha e zgjedhur sapo u rezervua. Provoni një orar tjetër.',
      );
    }
    throw error;
  }
}

export async function createManagedBookingReview(token: string, rating: number, comment?: string) {
  const booking = await getManagedBooking(token);
  if (booking.status !== 'COMPLETED')
    throw new AppError(
      409,
      'REVIEW_NOT_AVAILABLE',
      'Vlerësimi hapet pasi rezervimi të shënohet si i përfunduar.',
    );
  if (booking.review)
    throw new AppError(
      409,
      'REVIEW_EXISTS',
      'Ju e keni lënë tashmë një vlerësim për këtë rezervim.',
    );
  return prisma.review.create({
    data: { bookingId: booking.id, businessId: booking.businessId, rating, comment },
  });
}
