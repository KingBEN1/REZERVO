import { prisma } from '../db.js';
import { env } from '../config.js';
import { sendTransactionalEmail } from './email.service.js';
import { sendTransactionalSms } from './sms.service.js';
import { runtimeTimezone } from '../lib/timezone.js';

type BookingEvent = 'confirmed' | 'cancelled' | 'rescheduled';

function eventCopy(event: BookingEvent) {
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
        business: { include: { settings: true } },
        service: true,
        staff: true,
        customer: true,
      },
    });
    if (!booking) return;
    const copy = eventCopy(event);
    const manageUrl = `${env.WEB_ORIGIN}/manage/${booking.manageToken}`;
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
