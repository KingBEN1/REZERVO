import argon2 from 'argon2';
import { addDays, addHours, addMinutes, startOfDay } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { starterTemplateForCategory } from '../src/lib/business-templates.js';

const prisma = new PrismaClient();
const password = 'DemoPassword123!';

async function upsertUser(
  email: string,
  firstName: string,
  lastName: string,
  platformRole?: 'SUPER_ADMIN',
) {
  return prisma.user.upsert({
    where: { email },
    update: { firstName, lastName, platformRole },
    create: {
      email,
      firstName,
      lastName,
      platformRole,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      emailVerifiedAt: new Date(),
    },
  });
}

async function main() {
  const categories = await Promise.all(
    [
      ['barbers', 'Berberë & floktarë', 'Scissors'],
      ['beauty-salons', 'Sallone bukurie & estetikë', 'Sparkles'],
      ['spa-wellness', 'Spa, masazh & wellness', 'HeartPulse'],
      ['health-clinics', 'Klinika & mjekësi', 'Stethoscope'],
      ['dentists', 'Dentistë', 'Smile'],
      ['physiotherapy', 'Fizioterapi & rehabilitim', 'Activity'],
      ['fitness', 'Fitness, sport & trajnim', 'Dumbbell'],
      ['hotels', 'Hotele & akomodim', 'Hotel'],
      ['restaurants', 'Restorante & tavolina', 'Utensils'],
      ['taxi-transport', 'Taksi & transport', 'CarTaxiFront'],
      ['car-service', 'Servis, larje & gomisteri', 'Car'],
      ['photography', 'Fotografi & video', 'Camera'],
      ['events-venues', 'Evente & qira hapësirash', 'PartyPopper'],
      ['education', 'Kurse, mësime & konsultime', 'GraduationCap'],
      ['professional-services', 'Shërbime profesionale', 'BriefcaseBusiness'],
      ['home-services', 'Shërbime për shtëpi', 'House'],
      ['pet-care', 'Kujdes për kafshë', 'PawPrint'],
      ['legal-notary', 'Avokatë & noterë', 'Scale'],
      ['rentals', 'Qira pajisjesh & automjetesh', 'KeyRound'],
      ['tourism-activities', 'Ture & aktivitete', 'Compass'],
      ['coworking', 'Coworking & zyra', 'MonitorCog'],
      ['electronics-repair', 'Servis elektronik', 'Wrench'],
      ['child-care', 'Kujdes & aktivitete për fëmijë', 'Baby'],
      ['other', 'Tjetër', 'MoreHorizontal'],
    ].map(([slug, name, icon]) =>
      prisma.serviceCategory.upsert({
        where: { slug },
        update: { name, icon, active: true },
        create: { name, slug, icon },
      }),
    ),
  );
  const bySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));
  const [barbers, beauty, auto, dental] = [
    bySlug.barbers!,
    bySlug['beauty-salons']!,
    bySlug['car-service']!,
    bySlug.dentists!,
  ];
  const [monthlyPlan] = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { code: 'REZERVO_MONTHLY' },
      update: {
        name: 'Rezervo',
        description: 'Muaji i parë falas. Më pas 30 € në muaj, pa kontratë afatgjatë.',
        monthlyPrice: 30,
        annualPrice: null,
        limits: { staff: -1, bookings: -1, businesses: 1 },
        features: [
          'Muaji i parë falas',
          'Rezervime pa kufi',
          'Faqe publike për rezervime',
          'Ekip ose burime pa kufi',
          'Menaxhim klientësh dhe kalendar',
          'Mbështetje për kategori të ndryshme biznesi',
        ],
        active: true,
      },
      create: {
        code: 'REZERVO_MONTHLY',
        name: 'Rezervo',
        description: 'Muaji i parë falas. Më pas 30 € në muaj, pa kontratë afatgjatë.',
        monthlyPrice: 30,
        limits: { staff: -1, bookings: -1, businesses: 1 },
        features: [
          'Muaji i parë falas',
          'Rezervime pa kufi',
          'Faqe publike për rezervime',
          'Ekip ose burime pa kufi',
          'Menaxhim klientësh dhe kalendar',
          'Mbështetje për kategori të ndryshme biznesi',
        ],
      },
    }),
    ...['FREE', 'STARTER', 'PRO', 'BUSINESS'].map((code) =>
      prisma.subscriptionPlan.updateMany({ where: { code }, data: { active: false } }),
    ),
  ]);
  const [owner, customerUser] = await Promise.all([
    upsertUser('business@example.com', 'Ardit', 'Krasniqi'),
    upsertUser('customer@example.com', 'Elira', 'Gashi'),
  ]);
  // A public production database must never receive a known SUPER_ADMIN password.
  if (process.env.NODE_ENV !== 'production') {
    await upsertUser('admin@example.com', 'Arbër', 'Administrator', 'SUPER_ADMIN');
  }
  const freePlan = monthlyPlan;

  const demoBusinesses = [
    {
      name: 'Blend Barber',
      slug: 'blend-barber',
      city: 'Prishtinë',
      address: 'Rr. Garibaldi, Prishtinë',
      phone: '+383 44 123 456',
      description: 'BIZNES DEMO — provoni rezervimin, kodin e verifikimit dhe profilin e klientit pa pagesë reale.',
      categorySlug: 'barbers',
      coverImage:
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Prishtina Beauty Studio',
      slug: 'prishtina-beauty-studio',
      city: 'Prishtinë',
      address: 'Rr. B, Prishtinë',
      phone: '+383 45 234 567',
      description: 'Kujdes profesional për bukurinë tuaj.',
      categorySlug: 'beauty-salons',
      coverImage:
        'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Ferizaj Auto Care',
      slug: 'ferizaj-auto-care',
      city: 'Ferizaj',
      address: 'Zona Industriale, Ferizaj',
      phone: '+383 49 345 678',
      description: 'Detajim dhe kujdes i plotë për automjetin.',
      categorySlug: 'car-service',
      coverImage:
        'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Prizren Dental Clinic',
      slug: 'prizren-dental-clinic',
      city: 'Prizren',
      address: 'Rr. Adem Jashari, Prizren',
      phone: '+383 43 456 789',
      description: 'Buzëqeshje të shëndetshme me kujdes të afërt.',
      categorySlug: 'dentists',
      coverImage:
        'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Hotel Dardania',
      slug: 'hotel-dardania',
      city: 'Prishtinë',
      address: 'Rr. Ukshin Hoti, Prishtinë',
      phone: '+383 38 555 111',
      description: 'Qëndrim i rehatshëm në qendër të qytetit.',
      categorySlug: 'hotels',
      coverImage:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Sofra e Prizrenit',
      slug: 'sofra-e-prizrenit',
      city: 'Prizren',
      address: 'Shadërvan, Prizren',
      phone: '+383 44 555 222',
      description: 'Kuzhinë tradicionale dhe tavolina për familje.',
      categorySlug: 'restaurants',
      coverImage:
        'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Taxi Aeroporti 24',
      slug: 'taxi-aeroporti-24',
      city: 'Prishtinë',
      address: 'Prishtinë',
      phone: '+383 49 555 333',
      description: 'Transferime të sigurta për aeroport dhe qytet.',
      categorySlug: 'taxi-transport',
      coverImage:
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Relax Spa Pejë',
      slug: 'relax-spa-peje',
      city: 'Pejë',
      address: 'Rr. Mbretëresha Teutë, Pejë',
      phone: '+383 45 555 444',
      description: 'Masazh, wellness dhe kohë për veten.',
      categorySlug: 'spa-wellness',
      coverImage:
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Arena Fitness',
      slug: 'arena-fitness',
      city: 'Gjilan',
      address: 'Rr. Idriz Seferi, Gjilan',
      phone: '+383 43 555 555',
      description: 'Trajnim individual dhe klasa në grup.',
      categorySlug: 'fitness',
      coverImage:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Studio Lira Photo',
      slug: 'studio-lira-photo',
      city: 'Gjakovë',
      address: 'Rr. Nëna Terezë, Gjakovë',
      phone: '+383 44 555 666',
      description: 'Foto familjare, evente dhe seanca profesionale.',
      categorySlug: 'photography',
      coverImage:
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Salla Imperial',
      slug: 'salla-imperial',
      city: 'Ferizaj',
      address: 'Rr. Dëshmorët, Ferizaj',
      phone: '+383 49 555 777',
      description: 'Hapësirë për dasma, ditëlindje dhe takime.',
      categorySlug: 'events-venues',
      coverImage:
        'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Konsulta Juridike Besa',
      slug: 'konsulta-juridike-besa',
      city: 'Prishtinë',
      address: 'Rr. UÇK, Prishtinë',
      phone: '+383 45 555 888',
      description: 'Konsulta ligjore me termin të rezervuar.',
      categorySlug: 'legal-notary',
      coverImage:
        'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Paw Care Kosova',
      slug: 'paw-care-kosova',
      city: 'Mitrovicë',
      address: 'Rr. Mbretëresha Teutë, Mitrovicë',
      phone: '+383 43 555 999',
      description: 'Kujdes, grooming dhe termine për kafshët tuaja.',
      categorySlug: 'pet-care',
      coverImage:
        'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1400&q=80',
    },
    {
      name: 'Rent a Car Dukagjini',
      slug: 'rent-a-car-dukagjini',
      city: 'Pejë',
      address: 'Rr. Bill Clinton, Pejë',
      phone: '+383 44 555 000',
      description: 'Automjete të sigurta për qira ditore.',
      categorySlug: 'rentals',
      coverImage:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80',
    },
  ];
  const businesses = [];
  for (const item of demoBusinesses) {
    const { categorySlug, ...data } = item;
    const category = bySlug[categorySlug]!;
    const business = await prisma.business.upsert({
      where: { slug: item.slug },
      update: { ...data, categoryId: category.id },
      create: {
        ...data,
        categoryId: category.id,
        email: `${item.slug}@example.com`,
        status: 'ACTIVE',
        timezone: 'Europe/Pristina',
        currency: 'EUR',
      },
    });
    await prisma.businessMember.upsert({
      where: { businessId_userId: { businessId: business.id, userId: owner.id } },
      update: { role: 'BUSINESS_OWNER' },
      create: { businessId: business.id, userId: owner.id, role: 'BUSINESS_OWNER' },
    });
    await prisma.businessSettings.upsert({
      where: { businessId: business.id },
      update: {},
      create: { businessId: business.id },
    });
    await prisma.subscription.upsert({
      where: { businessId: business.id },
      update: { planId: freePlan.id, status: 'ACTIVE', provider: 'manual' },
      create: {
        businessId: business.id,
        planId: freePlan.id,
        status: 'ACTIVE',
        provider: 'manual',
      },
    });
    await prisma.businessVerification.upsert({
      where: { businessId: business.id },
      update: { status: 'APPROVED', reviewedAt: new Date(), reviewNote: 'Demo i verifikuar.' },
      create: {
        businessId: business.id,
        legalName: item.name,
        registrationNumber: `DEMO-${item.slug.toUpperCase()}`,
        contactName: 'Ardit Krasniqi',
        contactPhone: item.phone,
        status: 'APPROVED',
        submittedAt: new Date(),
        reviewedAt: new Date(),
        reviewNote: 'Demo i verifikuar.',
      },
    });
    if (item.slug !== 'blend-barber') {
      const template = starterTemplateForCategory(categorySlug);
      const resource = await prisma.staff.upsert({
        where: { id: `${business.id}-starter`.slice(0, 25) },
        update: {},
        create: {
          id: `${business.id}-starter`.slice(0, 25),
          businessId: business.id,
          name: template.resourceName,
          position: template.resourceRole,
          capacity: template.capacity,
        },
      });
      const service = await prisma.service.upsert({
        where: { id: `${business.id}-service`.slice(0, 25) },
        update: {},
        create: {
          id: `${business.id}-service`.slice(0, 25),
          businessId: business.id,
          name: template.serviceName,
          description: template.description,
          durationMin: template.durationMin,
          price: template.price || 20,
          priceType: template.priceType,
        },
      });
      await prisma.serviceStaff.upsert({
        where: { serviceId_staffId: { serviceId: service.id, staffId: resource.id } },
        update: {},
        create: { serviceId: service.id, staffId: resource.id },
      });
      for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek += 1) {
        const hours = await prisma.workingHours.findFirst({
          where: { businessId: business.id, staffId: null, dayOfWeek, startTime: '09:00' },
        });
        if (!hours)
          await prisma.workingHours.create({
            data: {
              businessId: business.id,
              dayOfWeek,
              startTime: '09:00',
              endTime: '18:00',
              isOpen: true,
            },
          });
      }
    }
    businesses.push(business);
  }
  const blend = businesses[0]!;
  let ardit = await prisma.staff.findFirst({
    where: { businessId: blend.id, name: 'Ardit Krasniqi' },
  });
  if (!ardit)
    ardit = await prisma.staff.create({
      data: {
        businessId: blend.id,
        userId: owner.id,
        name: 'Ardit Krasniqi',
        position: 'Berber',
        bio: 'I specializuar në fade, prerje klasike dhe rregullim mjekre.',
      },
    });
  let liridon = await prisma.staff.findFirst({
    where: { businessId: blend.id, name: 'Liridon Berisha' },
  });
  if (!liridon)
    liridon = await prisma.staff.create({
      data: { businessId: blend.id, name: 'Liridon Berisha', position: 'Berber' },
    });
  let haircut = await prisma.service.findFirst({
    where: { businessId: blend.id, name: 'Prerje flokësh' },
  });
  if (!haircut)
    haircut = await prisma.service.create({
      data: {
        businessId: blend.id,
        name: 'Prerje flokësh',
        durationMin: 30,
        price: 10,
        bufferAfter: 5,
      },
    });
  let hairAndBeard = await prisma.service.findFirst({
    where: { businessId: blend.id, name: 'Flokë + mjekër' },
  });
  if (!hairAndBeard)
    hairAndBeard = await prisma.service.create({
      data: {
        businessId: blend.id,
        name: 'Flokë + mjekër',
        durationMin: 45,
        price: 15,
        bufferAfter: 5,
      },
    });
  for (const [serviceId, staffId] of [
    [haircut.id, ardit.id],
    [haircut.id, liridon.id],
    [hairAndBeard.id, ardit.id],
  ]) {
    await prisma.serviceStaff.upsert({
      where: { serviceId_staffId: { serviceId, staffId } },
      update: {},
      create: { serviceId, staffId },
    });
  }
  for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek += 1) {
    // PostgreSQL unique keys containing NULL cannot be used by Prisma's upsert
    // selector, so business-wide (non-staff) hours are looked up explicitly.
    const existingHours = await prisma.workingHours.findFirst({
      where: { businessId: blend.id, staffId: null, dayOfWeek, startTime: '09:00' },
    });
    if (existingHours) {
      await prisma.workingHours.update({
        where: { id: existingHours.id },
        data: { endTime: '18:00', isOpen: true },
      });
    } else {
      await prisma.workingHours.create({
        data: {
          businessId: blend.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          isOpen: true,
        },
      });
    }
  }
  const client = await prisma.customer.upsert({
    where: { businessId_email: { businessId: blend.id, email: 'customer@example.com' } },
    update: {},
    create: {
      businessId: blend.id,
      userId: customerUser.id,
      name: 'Elira Gashi',
      email: 'customer@example.com',
      phone: '+383 44 765 432',
    },
  });
  const startAt = addHours(startOfDay(addDays(new Date(), 1)), 10);
  const nextDay = addDays(startOfDay(startAt), 1);
  // A seed must be safe to run repeatedly. The stable demo reference is the
  // primary identity; the calendar-day check also covers early development
  // seeds that were created before the stable reference was introduced.
  const existing = await prisma.booking.findFirst({
    where: {
      OR: [
        { reference: 'KR-DEMO-BLEND-001' },
        {
          businessId: blend.id,
          serviceId: haircut.id,
          staffId: ardit.id,
          customerId: client.id,
          startAt: { gte: startOfDay(startAt), lt: nextDay },
        },
      ],
    },
  });
  if (!existing) {
    await prisma.booking.create({
      data: {
        reference: 'KR-DEMO-BLEND-001',
        businessId: blend.id,
        serviceId: haircut.id,
        staffId: ardit.id,
        customerId: client.id,
        startAt,
        endAt: addMinutes(startAt, 30),
        bufferStartAt: startAt,
        bufferEndAt: addMinutes(startAt, 35),
        status: 'CONFIRMED',
        price: 10,
      },
    });
  }
  await prisma.featureFlag.upsert({
    where: { key: 'ENABLE_MARKETPLACE' },
    update: {},
    create: { key: 'ENABLE_MARKETPLACE', enabled: true },
  });
  await prisma.featureFlag.upsert({
    where: { key: 'ENABLE_PAYMENTS' },
    update: {},
    create: { key: 'ENABLE_PAYMENTS', enabled: false },
  });
  console.info(
    `Seed completed. Demo accounts: business@example.com, customer@example.com${
      process.env.NODE_ENV !== 'production' ? ', admin@example.com' : ''
    }`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
