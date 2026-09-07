import { addMinutes, differenceInCalendarDays } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { slotsForDay, type Interval } from '../lib/availability.js';
import { runtimeTimezone } from '../lib/timezone.js';

const activeStatuses = ['PENDING', 'CONFIRMED'] as const;

function zonedDayRange(date: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, day! + 1));
  const nextDate = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`;
  const resolvedTimezone = runtimeTimezone(timezone);
  const start = fromZonedTime(`${date}T00:00:00`, resolvedTimezone);
  const end = fromZonedTime(`${nextDate}T00:00:00`, resolvedTimezone);
  return { start, end };
}

export async function getPublicAvailability(input: {
  businessId: string;
  serviceId: string;
  staffId: string;
  date: string;
  ignoreBookingId?: string;
}) {
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, businessId: input.businessId, active: true },
  });
  const business = await prisma.business.findFirst({
    where: { id: input.businessId, status: 'ACTIVE', deletedAt: null },
    include: { settings: true },
  });
  const staff = await prisma.staff.findFirst({
    where: {
      id: input.staffId,
      businessId: input.businessId,
      active: true,
      services: { some: { serviceId: input.serviceId } },
    },
  });
  if (!business || !service || !staff) throw new AppError(404, 'AVAILABILITY_NOT_FOUND', 'Ky shërbim ose staf nuk është i disponueshëm.');

  const { start: dayStart, end: dayEnd } = zonedDayRange(input.date, business.timezone);
  const timezone = runtimeTimezone(business.timezone);
  const localDate = toZonedTime(dayStart, timezone);
  const daysAway = differenceInCalendarDays(localDate, toZonedTime(new Date(), timezone));
  const settings = business.settings;
  if (daysAway < 0 || daysAway > (settings?.maxBookingDays ?? 30)) return [];

  const dayOfWeek = localDate.getDay();
  const [staffHours, businessHours, bookings, blocked, exceptions] = await Promise.all([
    prisma.workingHours.findMany({ where: { businessId: input.businessId, staffId: input.staffId, dayOfWeek } }),
    prisma.workingHours.findMany({ where: { businessId: input.businessId, staffId: null, dayOfWeek } }),
    prisma.booking.findMany({
      where: {
        staffId: input.staffId,
        ...(input.ignoreBookingId ? { id: { not: input.ignoreBookingId } } : {}),
        status: { in: [...activeStatuses] },
        startAt: { lt: dayEnd },
        bufferEndAt: { gt: dayStart },
      },
      select: { bufferStartAt: true, bufferEndAt: true },
    }),
    prisma.blockedTime.findMany({
      where: { businessId: input.businessId, startAt: { lt: dayEnd }, endAt: { gt: dayStart }, OR: [{ staffId: null }, { staffId: input.staffId }] },
      select: { startAt: true, endAt: true },
    }),
    prisma.availabilityException.findMany({
      where: { businessId: input.businessId, available: false, startAt: { lt: dayEnd }, endAt: { gt: dayStart }, OR: [{ staffId: null }, { staffId: input.staffId }] },
      select: { startAt: true, endAt: true },
    }),
  ]);
  const unavailable: Interval[] = [
    ...bookings.map((booking) => ({ start: booking.bufferStartAt, end: booking.bufferEndAt })),
    ...blocked.map((item) => ({ start: item.startAt, end: item.endAt })),
    ...exceptions.map((item) => ({ start: item.startAt, end: item.endAt })),
  ];
  const earliestStart = addMinutes(new Date(), settings?.minNoticeMinutes ?? 60);
  return slotsForDay({
    dayStart,
    hours: (staffHours.length ? staffHours : businessHours).map(({ startTime, endTime, isOpen }) => ({ startTime, endTime, isOpen })),
    durationMin: service.durationMin,
    bufferBeforeMin: service.bufferBefore,
    bufferAfterMin: service.bufferAfter,
    unavailable,
    earliestStart,
  });
}

export async function assertBookableStart(input: {
  businessId: string;
  serviceId: string;
  staffId: string;
  startAt: Date;
}) {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: input.businessId }, include: { settings: true } });
  const local = toZonedTime(input.startAt, runtimeTimezone(business.timezone));
  const date = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
  const slots = await getPublicAvailability({ ...input, date });
  if (!slots.some((slot) => slot.start.getTime() === input.startAt.getTime())) {
    throw new AppError(409, 'BOOKING_UNAVAILABLE', 'Ky termin sapo është zënë ose nuk është i vlefshëm.');
  }
  return { business, endAt: addMinutes(input.startAt, (await prisma.service.findUniqueOrThrow({ where: { id: input.serviceId } })).durationMin) };
}
