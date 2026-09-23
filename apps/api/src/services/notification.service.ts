import { prisma } from '../db.js';
import { addMinutes } from 'date-fns';
import { env, webOrigins } from '../config.js';
import { sendTransactionalEmail } from './email.service.js';
import { sendTransactionalSms } from './sms.service.js';
import { runtimeTimezone } from '../lib/timezone.js';

type BookingEvent = 'confirmed' | 'pending' | 'cancelled' | 'rescheduled';

function eventCopy(event: BookingEvent) {
  if (event === 'pending')
    return {
      subject: 'Kërkesa juaj për rezervim u pranua',
      action: 'është në pritje të miratimit',
    };
  if (event === 'cancelled') return { subject: 'Rezervimi juaj u anulua', action: 'është anuluar' };
  if (event === 'rescheduled')
    return { subject: 'Rezervimi juaj u ndryshua', action: 'është ndryshuar' };
  return { subject: 'Rezervimi juaj u konfirmua', action: 'u konfirmua' };
}

function bookingDate(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('sq-XK', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: runtimeTimezone(timezone),
  }).format(date);
}

function ownerEmails(booking: {
  business: { email: string | null; members: Array<{ user: { email: string } }> };
}) {
  return [
    ...new Set(
      [
        booking.business.email,
        ...booking.business.members.map((member) => member.user.email),
      ].filter(Boolean),
    ),
  ] as string[];
}

async function sendOwnerBookingNotice(booking: {
  id: string;
  reference: string;
  status: string;
  startAt: Date;
  businessId: string;
  business: {
    name: string;
    timezone: string;
    email: string | null;
    members: Array<{ user: { email: string } }>;
  };
  service: { name: string };
  staff: { name: string };
  customer: { name: string; email: string | null; phone: string | null };
}) {
  const recipients = ownerEmails(booking);
  if (!recipients.length) return;
  const subject =
    booking.status === 'PENDING'
      ? `Kërkesë e re për rezervim · ${booking.business.name}`
      : `Rezervim i ri · ${booking.business.name}`;
  const message = `Rezervim i ri nga ${booking.customer.name} për ${booking.service.name} me ${booking.staff.name}. Koha: ${bookingDate(booking.startAt, booking.business.timezone)}. Referenca: ${booking.reference}. Kontakt: ${booking.customer.email ?? booking.customer.phone ?? '—'}.`;
  try {
    const notification = await prisma.notification.create({
      data: {
        businessId: booking.businessId,
        bookingId: booking.id,
        channel: 'EMAIL',
        template: 'business-booking-created',
        payload: { recipients, subject, message },
      },
    });
    try {
      await Promise.all(
        recipients.map((to) => sendTransactionalEmail({ to, subject, text: message })),
      );
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      console.error('Business booking email could not be sent', error);
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      });
    }
  } catch (error) {
    // A duplicate means this booking already notified the business.
    if (!(
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ))
      throw error;
  }
}

/**
 * Creates an auditable outbox entry. The `console` adapter deliberately sends
 * only to the server log, which makes local development safe and predictable.
 * Other providers remain queued until their adapter and credentials are added.
 */
export async function notifyBookingEvent(bookingId: string, event: BookingEvent) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        business: {
          include: {
            settings: true,
            members: {
              where: { role: { in: ['BUSINESS_OWNER', 'MANAGER'] } },
              select: { user: { select: { email: true } } },
            },
          },
        },
        service: true,
        staff: true,
        customer: true,
      },
    });
    if (!booking) return;
    await sendOwnerBookingNotice(booking);
    const copy = eventCopy(
      event === 'confirmed' && booking.status === 'PENDING' ? 'pending' : event,
    );
    const manageUrl = `${webOrigins[0]}/manage/${booking.manageToken}`;
    const payload = {
      event,
      bookingId: booking.id,
      reference: booking.reference,
      recipient: booking.customer.email ?? booking.customer.phone ?? null,
      subject: copy.subject,
      message: `Përshëndetje ${booking.customer.name}, rezervimi juaj për ${booking.service.name} te ${booking.business.name} ${copy.action}. ${bookingDate(booking.startAt, booking.business.timezone)}. Menaxho rezervimin: ${manageUrl}`,
      manageUrl,
    };

    if (booking.customer.email && booking.business.settings?.emailEnabled) {
      const notification = await prisma.notification.create({
        data: {
          businessId: booking.businessId,
          channel: 'EMAIL',
          template: `booking-${event}`,
          payload,
        },
      });
      try {
        await sendTransactionalEmail({
          to: booking.customer.email,
          subject: copy.subject,
          text: payload.message,
        });
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (error) {
        console.error('Booking email could not be sent', error);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'FAILED' },
        });
      }
    }

    if (booking.customer.phone && booking.business.settings?.smsEnabled) {
      const notification = await prisma.notification.create({
        data: {
          businessId: booking.businessId,
          channel: 'SMS',
          template: `booking-${event}`,
          payload,
        },
      });
      try {
        await sendTransactionalSms(booking.customer.phone, payload.message);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      } catch (error) {
        console.error('Booking SMS could not be sent', error);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'FAILED' },
        });
      }
    }

    if (booking.customer.phone && booking.business.settings?.whatsappEnabled) {
      const notification = await prisma.notification.create({
        data: {
          businessId: booking.businessId,
          channel: 'WHATSAPP',
          template: `booking-${event}`,
          payload,
        },
      });
      if (env.WHATSAPP_PROVIDER === 'console') {
        console.info(`[whatsapp:console] To: ${booking.customer.phone}\n${payload.message}`);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
      }
    }
  } catch (error) {
    // Communication must never invalidate an already-accepted booking.
    console.error('Booking notification could not be queued', error);
  }
}

/** Called by a protected external scheduler every five minutes. */
export async function sendDueBookingReminders() {
  const now = new Date();
  const from = addMinutes(now, 10);
  const to = addMinutes(now, 20);
  const bookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', startAt: { gte: from, lte: to } },
    include: {
      business: {
        include: {
          settings: true,
          members: {
            where: { role: { in: ['BUSINESS_OWNER', 'MANAGER'] } },
            select: { user: { select: { email: true } } },
          },
        },
      },
      service: true,
      staff: true,
      customer: true,
    },
    take: 100,
  });
  let sent = 0;
  for (const booking of bookings) {
    const ownerRecipients = ownerEmails(booking);
    const recipients = [
      ...new Set([booking.customer.email, ...ownerRecipients].filter(Boolean)),
    ] as string[];
    if (!recipients.length) continue;
    const subject = `Rikujtues: termini fillon së shpejti · ${booking.business.name}`;
    const message = `Rikujtues: termini për ${booking.service.name} me ${booking.staff.name} fillon së shpejti, ${bookingDate(booking.startAt, booking.business.timezone)}. Referenca: ${booking.reference}.`;
    try {
      const notification = await prisma.notification.create({
        data: {
          businessId: booking.businessId,
          bookingId: booking.id,
          channel: 'EMAIL',
          template: 'booking-reminder-15m',
          payload: { recipients, subject, message },
        },
      });
      try {
        await Promise.all(
          recipients.map((recipient) =>
            sendTransactionalEmail({ to: recipient, subject, text: message }),
          ),
        );
        if (booking.customer.phone && booking.business.settings?.smsEnabled)
          await sendTransactionalSms(booking.customer.phone, message);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        sent += 1;
      } catch (error) {
        console.error('Booking reminder could not be sent', error);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'FAILED' },
        });
      }
    } catch (error) {
      if (!(
        typeof error === 'object' &&
        error &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ))
        throw error;
    }
  }
  return { checked: bookings.length, sent };
}
