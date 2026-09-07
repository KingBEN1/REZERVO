import { z } from 'zod';

const email = z.string().trim().email().max(254);
const phone = z.string().trim().min(6).max(32).optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Koha duhet të jetë në formatin HH:MM.');
const coordinate = z.number().finite();

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().min(2).max(80),
    email,
    password: z.string().min(12).max(128),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const loginSchema = z.object({
  body: z.object({ email, password: z.string().min(1).max(128) }),
  query: z.object({}),
  params: z.object({}),
});

export const forgotPasswordSchema = z.object({
  body: z.object({ email }),
  query: z.object({}),
  params: z.object({}),
});

export const resetPasswordSchema = z.object({
  body: z.object({ token: z.string().min(40).max(4096), password: z.string().min(12).max(128) }),
  query: z.object({}),
  params: z.object({}),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(40).max(4096) }),
  query: z.object({}),
  params: z.object({}),
});

export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .min(3)
      .max(80),
    city: z.string().trim().min(2).max(80),
    categoryId: z.string().cuid(),
    phone: z.string().trim().min(6).max(32).optional().or(z.literal('')),
    email: email.optional().or(z.literal('')),
    address: z.string().trim().max(180).optional(),
    description: z.string().trim().max(1200).optional(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const businessVerificationSchema = z.object({
  body: z.object({
    legalName: z.string().trim().min(2).max(180),
    registrationNumber: z.string().trim().min(3).max(80),
    contactName: z.string().trim().min(2).max(120),
    contactPhone: z.string().trim().min(6).max(32),
    website: z.string().trim().url().max(300).optional().or(z.literal('')),
    confirmAuthority: z.literal(true),
    confirmAccurate: z.literal(true),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const reviewBusinessVerificationSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    reviewNote: z.string().trim().max(1000).optional(),
  }),
  query: z.object({}),
  params: z.object({ id: z.string().cuid() }),
});

export const serviceSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1200).optional(),
    durationMin: z.number().int().min(5).max(480),
    price: z.number().min(0).max(10000),
    priceType: z.enum(['FIXED', 'OPTIONAL', 'FREE', 'CUSTOM']).default('FIXED'),
    bufferBefore: z.number().int().min(0).max(120).default(0),
    bufferAfter: z.number().int().min(0).max(120).default(0),
    staffIds: z.array(z.string().cuid()).min(1),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const staffSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    position: z.string().trim().max(100).optional(),
    bio: z.string().trim().max(1200).optional(),
    capacity: z.number().int().min(1).max(1000).default(1),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const businessProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(120),
      description: z.string().trim().max(1200).optional(),
      phone: z.string().trim().min(6).max(32).optional().or(z.literal('')),
      email: email.optional().or(z.literal('')),
      website: z.string().trim().url().max(300).optional().or(z.literal('')),
      city: z.string().trim().min(2).max(80),
      municipality: z.string().trim().max(80).optional(),
      address: z.string().trim().max(180).optional(),
      logo: z.string().trim().url().max(1000).optional().or(z.literal('')),
      coverImage: z.string().trim().url().max(1000).optional().or(z.literal('')),
      latitude: coordinate.min(-90).max(90).nullable().optional(),
      longitude: coordinate.min(-180).max(180).nullable().optional(),
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Dërgoni të paktën një fushë për ndryshim.',
    }),
  query: z.object({}),
  params: z.object({}),
});

export const businessSettingsSchema = z.object({
  body: z.object({
    requireApproval: z.boolean(),
    allowGuestBooking: z.boolean(),
    minNoticeMinutes: z.number().int().min(0).max(10_080),
    maxBookingDays: z.number().int().min(1).max(365),
    cancellationDeadlineMin: z.number().int().min(0).max(43_200),
    reschedulingEnabled: z.boolean(),
    reminderHours: z.number().int().min(0).max(720),
    emailEnabled: z.boolean(),
    smsEnabled: z.boolean(),
    whatsappEnabled: z.boolean(),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const couponSchema = z.object({
  body: z
    .object({
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9_-]{3,40}$/, 'Kodi mund të përmbajë vetëm shkronja, numra, - dhe _.'),
      percentOff: z.number().int().min(1).max(100).optional(),
      amountOff: z.number().min(0.01).max(10_000).optional(),
      startsAt: z.string().datetime({ offset: true }).optional(),
      endsAt: z.string().datetime({ offset: true }).optional(),
    })
    .refine((value) => Boolean(value.percentOff) !== Boolean(value.amountOff), {
      message: 'Zgjidhni zbritje në përqindje ose shumë fikse.',
    }),
  query: z.object({}),
  params: z.object({}),
});

export const workingHoursSchema = z.object({
  body: z.object({
    hours: z
      .array(
        z
          .object({
            dayOfWeek: z.number().int().min(0).max(6),
            isOpen: z.boolean(),
            startTime: time,
            endTime: time,
          })
          .refine((value) => !value.isOpen || value.startTime < value.endTime, {
            message: 'Ora e mbylljes duhet të jetë pas orës së hapjes.',
          }),
      )
      .length(7)
      .refine((hours) => new Set(hours.map((item) => item.dayOfWeek)).size === 7, {
        message: 'Duhet të përfshihet çdo ditë e javës.',
      })
      .refine((hours) => hours.some((item) => item.isOpen), {
        message: 'Zgjidhni të paktën një ditë të hapur.',
      }),
  }),
  query: z.object({}),
  params: z.object({}),
});

export const availabilitySchema = z.object({
  body: z.object({}),
  query: z.object({
    serviceId: z.string().cuid(),
    staffId: z.string().cuid(),
    date: isoDate,
  }),
  params: z.object({ slug: z.string().min(3).max(80) }),
});

export const accommodationAvailabilitySchema = z.object({
  body: z.object({}),
  query: z.object({
    serviceId: z.string().cuid(),
    staffId: z.string().cuid(),
    checkInDate: isoDate,
    checkOutDate: isoDate,
    guestCount: z.coerce.number().int().min(1).max(1000),
  }),
  params: z.object({ slug: z.string().min(3).max(80) }),
});

export const publicBookingSchema = z.object({
  body: z
    .object({
      serviceId: z.string().cuid(),
      staffId: z.string().cuid(),
      bookingKind: z.enum(['APPOINTMENT', 'ACCOMMODATION', 'TRANSPORT']).default('APPOINTMENT'),
      startAt: z.string().datetime({ offset: true }).optional(),
      checkInDate: isoDate.optional(),
      checkOutDate: isoDate.optional(),
      guestCount: z.number().int().min(1).max(1000).optional(),
      pickupAddress: z.string().trim().min(3).max(300).optional(),
      destinationAddress: z.string().trim().min(3).max(300).optional(),
      passengerCount: z.number().int().min(1).max(100).optional(),
      couponCode: z.string().trim().min(3).max(40).optional(),
      customer: z.object({
        name: z.string().trim().min(2).max(120),
        email: email.optional(),
        phone,
      }),
      customerNote: z.string().trim().max(1000).optional(),
      bookingVerificationId: z.string().cuid(),
      website: z.string().max(0).optional(),
    })
    .superRefine((data, context) => {
      if (data.bookingKind !== 'ACCOMMODATION' && !data.startAt)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startAt'],
          message: 'Zgjidhni kohën e rezervimit.',
        });
      if (data.bookingKind === 'ACCOMMODATION') {
        if (!data.checkInDate)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['checkInDate'],
            message: 'Zgjidhni datën e hyrjes.',
          });
        if (!data.checkOutDate)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['checkOutDate'],
            message: 'Zgjidhni datën e daljes.',
          });
        if (data.checkInDate && data.checkOutDate && data.checkOutDate <= data.checkInDate)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['checkOutDate'],
            message: 'Data e daljes duhet të jetë pas datës së hyrjes.',
          });
        if (!data.guestCount)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['guestCount'],
            message: 'Zgjidhni numrin e mysafirëve.',
          });
      }
      if (data.bookingKind === 'TRANSPORT') {
        if (!data.pickupAddress)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['pickupAddress'],
            message: 'Shkruani vendin e nisjes.',
          });
        if (!data.destinationAddress)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['destinationAddress'],
            message: 'Shkruani destinacionin.',
          });
        if (!data.passengerCount)
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passengerCount'],
            message: 'Zgjidhni numrin e udhëtarëve.',
          });
      }
    }),
  query: z.object({}),
  params: z.object({ slug: z.string().min(3).max(80) }),
});

export const bookingVerificationRequestSchema = z.object({
  body: z.object({ email }),
  query: z.object({}),
  params: z.object({}),
});

export const bookingVerificationConfirmSchema = z.object({
  body: z.object({ challengeId: z.string().cuid(), code: z.string().regex(/^\d{6}$/, 'Kodi duhet të ketë 6 shifra.') }),
  query: z.object({}),
  params: z.object({}),
});

export const manageBookingTokenSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({ token: z.string().uuid() }),
});

export const cancelManagedBookingSchema = z.object({
  body: z.object({ reason: z.string().trim().max(500).optional() }),
  query: z.object({}),
  params: z.object({ token: z.string().uuid() }),
});

export const rescheduleManagedBookingSchema = z.object({
  body: z.object({ startAt: z.string().datetime({ offset: true }) }),
  query: z.object({}),
  params: z.object({ token: z.string().uuid() }),
});

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1200).optional(),
  }),
  query: z.object({}),
  params: z.object({ token: z.string().uuid() }),
});
