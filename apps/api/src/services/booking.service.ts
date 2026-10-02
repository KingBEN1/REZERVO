import { addMinutes } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { AppError } from '../lib/errors.js';
import { bookingReference } from '../lib/reference.js';
import { getPublicAvailability } from './availability.service.js';
import { runtimeTimezone } from '../lib/timezone.js';
import { notifyBookingEvent } from './notification.service.js';
import { consumeBookingVerification } from './booking-verification.service.js';

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

export async function createPublicBooking(input: {
  slug: string;
  serviceId: string;
  staffId: string;
  bookingKind?: 'APPOINTMENT' | 'ACCOMMODATION' | 'TRANSPORT' | 'TOUR' | 'CLASS' | 'RENTAL' | 'EVENT' | 'TABLE';
  startAt?: Date;
  checkInDate?: string;
  checkOutDate?: string;
  guestCount?: number;
  pickupAddress?: string;
  destinationAddress?: string;
  passengerCount?: number;
  tourDepartureId?: string;
  couponCode?: string;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER';
  customer: { name: string; email?: string; phone?: string };
  customerNote?: string;
  customerUserId?: string;
  bookingVerificationId: string;
}) {
  try {
    const booking = await prisma.$transaction(
      async (tx) => {
        const business = await tx.business.findFirst({
          where: { slug: input.slug, status: 'ACTIVE', deletedAt: null },
          include: { settings: true, category: { select: { slug: true } } },
        });
        if (!business)
          throw new AppError(
            404,
            'BUSINESS_NOT_FOUND',
            'Biznesi nuk u gjet ose nuk pranon rezervime.',
          );
        if (!business.settings?.allowGuestBooking && !input.customerUserId) {
          throw new AppError(401, 'ACCOUNT_REQUIRED', 'Ky biznes kërkon llogari për rezervim.');
        }
        const paymentMethod = input.paymentMethod ?? 'CASH';
        if (!business.settings?.requirePrepayment) {
          if (paymentMethod === 'CASH' && business.settings && !business.settings.cashPaymentEnabled)
            throw new AppError(422, 'PAYMENT_METHOD_UNAVAILABLE', 'Pagesa cash nuk është e aktivizuar nga ky biznes.');
          if (paymentMethod === 'BANK_TRANSFER' && (!business.settings?.bankTransferEnabled || !business.settings.bankName || !business.settings.bankAccountHolder || !business.settings.bankIban))
            throw new AppError(422, 'PAYMENT_METHOD_UNAVAILABLE', 'Transferi bankar nuk është i disponueshëm për këtë biznes.');
        }
        const service = await tx.service.findFirst({
          where: { id: input.serviceId, businessId: business.id, active: true },
        });
        const staff = await tx.staff.findFirst({
          where: {
            id: input.staffId,
            businessId: business.id,
            active: true,
            services: { some: { serviceId: input.serviceId } },
          },
        });
        if (!service || !staff)
          throw new AppError(
            422,
            'INVALID_BOOKING',
            'Shërbimi ose anëtari i stafit nuk është i vlefshëm.',
          );
        if (['legal-notary', 'car-service', 'electronics-repair', 'home-services'].includes(business.category?.slug ?? '') && !input.customerNote?.trim())
          throw new AppError(422, 'BOOKING_DETAILS_REQUIRED', 'Shkruani detajet e nevojshme para rezervimit.');

        const bookingKind = input.bookingKind ?? 'APPOINTMENT';
        let startAt: Date;
        let endAt: Date;
        let bufferStartAt: Date;
        let bufferEndAt: Date;
        let price: Prisma.Decimal = service.price;
        let checkInDate: Date | undefined;
        let checkOutDate: Date | undefined;
        let tourDepartureId: string | undefined;
        let pickupAddress = input.pickupAddress;
        let destinationAddress = input.destinationAddress;

        if (bookingKind === 'TOUR' || bookingKind === 'CLASS') {
          if (!input.tourDepartureId || !input.guestCount)
            throw new AppError(422, 'INVALID_BOOKING', bookingKind === 'TOUR' ? 'Zgjidhni nisjen dhe pjesëmarrësit e turit.' : 'Zgjidhni seancën dhe pjesëmarrësit.');
          const departure = await tx.tourDeparture.findFirst({
            where: { id: input.tourDepartureId, serviceId: service.id, staffId: staff.id, active: true },
            include: { bookings: { where: { status: { in: ['PENDING', 'CONFIRMED'] } }, select: { guestCount: true } } },
          });
          if (!departure || departure.startAt.getTime() <= Date.now())
            throw new AppError(409, 'SCHEDULED_SESSION_UNAVAILABLE', bookingKind === 'TOUR' ? 'Kjo nisje nuk është më e disponueshme.' : 'Kjo seancë nuk është më e disponueshme.');
          const bookedSeats = departure.bookings.reduce((sum, booking) => sum + (booking.guestCount ?? 0), 0);
          if (bookedSeats + input.guestCount > departure.capacity)
            throw new AppError(409, 'CAPACITY_EXCEEDED', `Kanë mbetur vetëm ${Math.max(0, departure.capacity - bookedSeats)} vende.`);
          const details = (service.bookingDetails ?? {}) as { minParticipants?: number };
          if (details.minParticipants && input.guestCount < details.minParticipants)
            throw new AppError(422, 'MINIMUM_PARTICIPANTS', `${bookingKind === 'TOUR' ? 'Ky tur' : 'Kjo seancë'} kërkon të paktën ${details.minParticipants} pjesëmarrës.`);
          startAt = departure.startAt;
          endAt = departure.endAt;
          bufferStartAt = startAt;
          bufferEndAt = endAt;
          price = new Prisma.Decimal(service.price).mul(input.guestCount);
          tourDepartureId = departure.id;
        } else if (bookingKind === 'ACCOMMODATION' || bookingKind === 'RENTAL') {
          if (!input.checkInDate || !input.checkOutDate || !input.guestCount)
            throw new AppError(422, 'INVALID_BOOKING', bookingKind === 'ACCOMMODATION' ? 'Plotësoni datat dhe numrin e mysafirëve.' : 'Plotësoni datat e marrjes dhe kthimit.');
          checkInDate = new Date(`${input.checkInDate}T12:00:00.000Z`);
          checkOutDate = new Date(`${input.checkOutDate}T12:00:00.000Z`);
          if (
            Number.isNaN(checkInDate.getTime()) ||
            Number.isNaN(checkOutDate.getTime()) ||
            checkOutDate <= checkInDate
          )
            throw new AppError(422, 'INVALID_BOOKING', 'Datat e akomodimit nuk janë të vlefshme.');
          if (
            checkInDate.getTime() <
            Date.now() + (business.settings?.minNoticeMinutes ?? 60) * 60_000
          )
            throw new AppError(
              422,
              'BOOKING_TOO_SOON',
              'Data e hyrjes është shumë afër për rezervim.',
            );
          if (
            checkInDate.getTime() >
            Date.now() + (business.settings?.maxBookingDays ?? 30) * 86_400_000
          )
            throw new AppError(
              422,
              'BOOKING_TOO_FAR',
              'Data e hyrjes është jashtë afatit të lejuar për rezervim.',
            );
          if (input.guestCount > staff.capacity)
            throw new AppError(
              422,
              'CAPACITY_EXCEEDED',
              bookingKind === 'ACCOMMODATION' ? `Ky burim pranon maksimumi ${staff.capacity} mysafirë.` : `Ky artikull mund të rezervohet për maksimumi ${staff.capacity} njësi.`,
            );
          const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000);
          startAt = checkInDate;
          endAt = checkOutDate;
          bufferStartAt = startAt;
          bufferEndAt = endAt;
          price = new Prisma.Decimal(service.price).mul(nights);
        } else {
          if (!input.startAt)
            throw new AppError(422, 'INVALID_BOOKING', 'Zgjidhni një kohë të vlefshme.');
          // Recalculate against the server source of truth immediately before persistence.
          const localDate = zonedIsoDate(input.startAt, business.timezone);
          const available = await getPublicAvailability({
            businessId: business.id,
            serviceId: service.id,
            staffId: staff.id,
            date: localDate,
          });
          if (!available.some((slot) => slot.start.getTime() === input.startAt!.getTime())) {
            throw new AppError(
              409,
              'BOOKING_UNAVAILABLE',
              'Ky termin sapo është zënë ose nuk është i vlefshëm.',
            );
          }
          startAt = input.startAt;
          endAt = addMinutes(startAt, service.durationMin);
          bufferStartAt = addMinutes(startAt, -service.bufferBefore);
          bufferEndAt = addMinutes(endAt, service.bufferAfter);
        }
        if ((bookingKind === 'EVENT' || bookingKind === 'TABLE') && (!input.guestCount || input.guestCount > staff.capacity))
          throw new AppError(422, 'CAPACITY_EXCEEDED', bookingKind === 'TABLE' ? `Kjo tavolinë pranon maksimumi ${staff.capacity} persona.` : `Kjo hapësirë pranon maksimumi ${staff.capacity} mysafirë.`);
        if (bookingKind === 'TRANSPORT') {
          const route = (service.bookingDetails ?? {}) as { departurePoint?: string; returnPoint?: string };
          if (route.departurePoint && route.returnPoint) {
            pickupAddress = route.departurePoint;
            destinationAddress = route.returnPoint;
          }
        }
        const collision = await tx.booking.findFirst({
          where: {
            staffId: staff.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            ...(['TOUR', 'CLASS'].includes(bookingKind) ? { OR: [{ tourDepartureId: null }, { tourDepartureId: { not: tourDepartureId } }] } : {}),
            bufferStartAt: { lt: bufferEndAt },
            bufferEndAt: { gt: bufferStartAt },
          },
          select: { id: true },
        });
        if (collision)
          throw new AppError(
            409,
            'BOOKING_UNAVAILABLE',
            'Ky termin sapo është zënë ose nuk është i vlefshëm.',
          );

        if (input.couponCode) {
          const now = new Date();
          const coupon = await tx.coupon.findFirst({
            where: {
              businessId: business.id,
              code: { equals: input.couponCode.toUpperCase() },
              active: true,
              AND: [
                { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
              ],
            },
          });
          if (!coupon)
            throw new AppError(
              422,
              'INVALID_COUPON',
              'Kodi promocional nuk është i vlefshëm ose ka skaduar.',
            );
          if (coupon.percentOff) price = price.mul(100 - coupon.percentOff).div(100);
          if (coupon.amountOff)
            price = Prisma.Decimal.max(new Prisma.Decimal(0), price.sub(coupon.amountOff));
        }

        // When a guest is signed in, the server is the source of truth for the
        // account link and email. This makes the reservation visible in that
        // user's profile and prevents a browser from linking another account.
        const account = input.customerUserId
          ? await tx.user.findUnique({
              where: { id: input.customerUserId },
              select: { id: true, email: true },
            })
          : null;
        const email = account?.email ?? input.customer.email?.toLowerCase();
        if (!email)
          throw new AppError(422, 'VERIFICATION_REQUIRED', 'Shkruani dhe verifikoni emailin tuaj.');
        await consumeBookingVerification(
          tx,
          input.bookingVerificationId,
          email,
          input.customer.phone,
        );
        const activeBookings = await tx.booking.count({
          where: {
            businessId: business.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startAt: { gte: new Date() },
            customer: {
              OR: [
                { email },
                ...(input.customer.phone ? [{ phone: input.customer.phone }] : []),
                ...(account ? [{ userId: account.id }] : []),
              ],
            },
          },
        });
        if (activeBookings >= 3)
          throw new AppError(
            429,
            'ACTIVE_BOOKING_LIMIT',
            'Keni arritur kufirin prej 3 rezervimeve aktive te ky biznes. Menaxhoni rezervimet ekzistuese para se të krijoni një tjetër.',
          );
        const existingCustomer =
          account || email
            ? await tx.customer.findFirst({
                where: {
                  businessId: business.id,
                  OR: [...(account ? [{ userId: account.id }] : []), ...(email ? [{ email }] : [])],
                },
              })
            : null;
        const customer = existingCustomer
          ? await tx.customer.update({
              where: { id: existingCustomer.id },
              data: {
                name: input.customer.name,
                phone: input.customer.phone,
                ...(email ? { email } : {}),
                ...(account ? { userId: account.id } : {}),
              },
            })
          : await tx.customer.create({
              data: {
                businessId: business.id,
                name: input.customer.name,
                email,
                phone: input.customer.phone,
                userId: account?.id,
              },
            });

        const booking = await tx.booking.create({
          data: {
            reference: bookingReference(),
            businessId: business.id,
            serviceId: service.id,
            staffId: staff.id,
            customerId: customer.id,
            startAt,
            endAt,
            bufferStartAt,
            bufferEndAt,
            status:
              business.settings?.requireApproval || business.settings?.requirePrepayment || paymentMethod === 'BANK_TRANSFER'
                ? 'PENDING'
                : 'CONFIRMED',
            kind: bookingKind,
            checkInDate,
            checkOutDate,
            guestCount: ['ACCOMMODATION', 'RENTAL', 'TOUR', 'CLASS', 'EVENT', 'TABLE'].includes(bookingKind) ? input.guestCount : null,
            pickupAddress: bookingKind === 'TRANSPORT' ? pickupAddress : null,
            destinationAddress: bookingKind === 'TRANSPORT' ? destinationAddress : null,
            passengerCount: bookingKind === 'TRANSPORT' ? input.passengerCount : null,
            tourDepartureId,
            price,
            currency: business.currency,
            customerNote: input.customerNote,
          },
          include: { service: true, staff: true, customer: true, business: true },
        });
        const payment = business.settings?.requirePrepayment
          ? await tx.payment.create({
              data: {
                businessId: business.id,
                bookingId: booking.id,
                amount: new Prisma.Decimal(price).mul(business.settings.depositPercent).div(100),
                currency: business.currency,
                provider: 'paypal',
                metadata: { depositPercent: business.settings.depositPercent },
              },
            })
          : await tx.payment.create({
              data: {
                businessId: business.id,
                bookingId: booking.id,
                amount: price,
                currency: business.currency,
                provider: paymentMethod === 'BANK_TRANSFER' ? 'bank_transfer' : 'cash',
                metadata: paymentMethod === 'BANK_TRANSFER'
                  ? {
                      bankName: business.settings?.bankName,
                      accountHolder: business.settings?.bankAccountHolder,
                      iban: business.settings?.bankIban,
                      instructions: business.settings?.bankReferenceInstructions ?? null,
                      qrUrlTemplate: business.settings?.bankQrUrlTemplate ?? null,
                    }
                  : undefined,
              },
            });
        await tx.auditLog.create({
          data: {
            businessId: business.id,
            action: 'BOOKING_CREATED',
            entity: 'Booking',
            entityId: booking.id,
          },
        });
        return { ...booking, payment };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (booking.payment?.provider !== 'paypal') await notifyBookingEvent(booking.id, 'confirmed');
    const bankTransfer = booking.payment?.provider === 'bank_transfer'
      ? booking.payment.metadata as { bankName: string; accountHolder: string; iban: string; instructions?: string | null; qrUrlTemplate?: string | null }
      : null;
    return { ...booking, payment: booking.payment?.provider === 'paypal' ? booking.payment : null, paymentMethod: booking.payment?.provider === 'bank_transfer' ? 'BANK_TRANSFER' : 'CASH', bankTransfer };
  } catch (error) {
    if (error instanceof AppError) throw error;
    // PostgreSQL exclusion constraint error means a concurrent request claimed the slot.
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      ['P2004', 'P2034'].includes((error as { code?: string }).code ?? '')
    ) {
      throw new AppError(
        409,
        'BOOKING_UNAVAILABLE',
        'Ky termin sapo është zënë ose nuk është i vlefshëm.',
      );
    }
    throw error;
  }
}
