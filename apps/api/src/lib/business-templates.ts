import type { PriceType } from '@prisma/client';

type StarterTemplate = {
  resourceName: string;
  resourceRole: string;
  capacity: number;
  serviceName: string;
  description: string;
  durationMin: number;
  price: number;
  priceType: PriceType;
};

const templates: Record<string, StarterTemplate> = {
  barbers: { resourceName: 'Berberi 1', resourceRole: 'Berber', capacity: 1, serviceName: 'Prerje flokësh', description: 'Model fillestar — përshtateni me shërbimet e berberisë.', durationMin: 30, price: 0, priceType: 'CUSTOM' },
  'beauty-salons': { resourceName: 'Stilistja 1', resourceRole: 'Stilist', capacity: 1, serviceName: 'Trajtim bukurie', description: 'Model fillestar — përshtateni me trajtimet e sallonit.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  'spa-wellness': { resourceName: 'Terapisti 1', resourceRole: 'Terapist', capacity: 1, serviceName: 'Masazh relaksues', description: 'Model fillestar — përshtateni me trajtimet e wellness-it.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  'health-clinics': { resourceName: 'Dr. 1', resourceRole: 'Mjek', capacity: 1, serviceName: 'Kontrollë mjekësore', description: 'Model fillestar — përshtateni me shërbimet e klinikës.', durationMin: 30, price: 0, priceType: 'CUSTOM' },
  dentists: { resourceName: 'Dr. 1', resourceRole: 'Dentist', capacity: 1, serviceName: 'Kontrollë dentare', description: 'Model fillestar — përshtateni me shërbimet dentare.', durationMin: 30, price: 0, priceType: 'CUSTOM' },
  physiotherapy: { resourceName: 'Fizioterapisti 1', resourceRole: 'Fizioterapist', capacity: 1, serviceName: 'Seancë fizioterapie', description: 'Model fillestar — përshtateni me seancat e rehabilitimit.', durationMin: 45, price: 0, priceType: 'CUSTOM' },
  hotels: {
    resourceName: 'Dhoma standarde 1',
    resourceRole: 'Dhomë',
    capacity: 2,
    serviceName: 'Qëndrim për natë',
    description: 'Model fillestar — vendosni çmimin dhe detajet e dhomës.',
    durationMin: 60,
    price: 0,
    priceType: 'CUSTOM',
  },
  restaurants: {
    resourceName: 'Tavolina 1',
    resourceRole: 'Tavolinë',
    capacity: 4,
    serviceName: 'Rezervim tavoline',
    description: 'Model fillestar — përshtateni sipas kapacitetit dhe orarit tuaj.',
    durationMin: 120,
    price: 0,
    priceType: 'FREE',
  },
  'taxi-transport': {
    resourceName: 'Automjeti 1',
    resourceRole: 'Automjet',
    capacity: 4,
    serviceName: 'Kërkesë për udhëtim',
    description: 'Model fillestar — klienti vendos nisjen dhe destinacionin.',
    durationMin: 60,
    price: 0,
    priceType: 'CUSTOM',
  },
  'events-venues': {
    resourceName: 'Salla kryesore',
    resourceRole: 'Hapësirë eventi',
    capacity: 100,
    serviceName: 'Rezervim date eventi',
    description: 'Model fillestar — përcaktoni çmimin, kapacitetin dhe rregullat.',
    durationMin: 240,
    price: 0,
    priceType: 'CUSTOM',
  },
  'car-service': {
    resourceName: 'Vendi i punës 1',
    resourceRole: 'Vend pune',
    capacity: 1,
    serviceName: 'Termin për automjet',
    description: 'Model fillestar për servis, larje ose gomisteri.',
    durationMin: 60,
    price: 0,
    priceType: 'CUSTOM',
  },
  'home-services': {
    resourceName: 'Ekipi në terren',
    resourceRole: 'Ekip shërbimi',
    capacity: 1,
    serviceName: 'Vizitë në terren',
    description: 'Model fillestar për shërbime në shtëpi ose zyrë.',
    durationMin: 60,
    price: 0,
    priceType: 'CUSTOM',
  },
  fitness: {
    resourceName: 'Trajneri 1',
    resourceRole: 'Trajner',
    capacity: 1,
    serviceName: 'Seancë stërvitore',
    description: 'Model fillestar për trajnim individual ose klasë.',
    durationMin: 60,
    price: 0,
    priceType: 'CUSTOM',
  },
  education: {
    resourceName: 'Instruktori 1',
    resourceRole: 'Instruktor',
    capacity: 1,
    serviceName: 'Konsultë ose mësim',
    description: 'Model fillestar për mësime, kurse ose konsultime.',
    durationMin: 60,
    price: 0,
    priceType: 'CUSTOM',
  },
  photography: { resourceName: 'Fotografi 1', resourceRole: 'Fotograf', capacity: 1, serviceName: 'Fotosesion', description: 'Model fillestar — përshtateni me paketat e fotografisë ose videos.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  rentals: { resourceName: 'Artikulli 1', resourceRole: 'Pajisje ose automjet', capacity: 1, serviceName: 'Qira ditore', description: 'Model fillestar — përshtateni me artikullin që jepni me qira.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  'tourism-activities': { resourceName: 'Guida 1', resourceRole: 'Guidë', capacity: 12, serviceName: 'Tur i organizuar', description: 'Model fillestar — përshtateni me turin ose aktivitetin.', durationMin: 180, price: 0, priceType: 'CUSTOM' },
  coworking: { resourceName: 'Tavolina 1', resourceRole: 'Tavolinë pune', capacity: 1, serviceName: 'Hapësirë pune ditore', description: 'Model fillestar — përshtateni me hapësirat dhe paketat tuaja.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  'electronics-repair': { resourceName: 'Tekniku 1', resourceRole: 'Teknik', capacity: 1, serviceName: 'Riparim pajisjeje', description: 'Model fillestar — përshtateni me llojet e riparimit.', durationMin: 45, price: 0, priceType: 'CUSTOM' },
  'child-care': { resourceName: 'Edukatori 1', resourceRole: 'Edukator', capacity: 8, serviceName: 'Aktivitet për fëmijë', description: 'Model fillestar — përshtateni me aktivitetet dhe grupmoshat.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  'pet-care': { resourceName: 'Kujdestari 1', resourceRole: 'Kujdestar kafshësh', capacity: 1, serviceName: 'Kujdes për kafshë', description: 'Model fillestar — përshtateni me shërbimet për kafshë.', durationMin: 60, price: 0, priceType: 'CUSTOM' },
  'legal-notary': { resourceName: 'Avokati 1', resourceRole: 'Avokat ose noter', capacity: 1, serviceName: 'Konsultë ligjore', description: 'Model fillestar — përshtateni me llojin e konsultës.', durationMin: 30, price: 0, priceType: 'CUSTOM' },
  'professional-services': { resourceName: 'Konsulenti 1', resourceRole: 'Konsulent', capacity: 1, serviceName: 'Konsultë profesionale', description: 'Model fillestar — përshtateni me shërbimin tuaj.', durationMin: 45, price: 0, priceType: 'CUSTOM' },
};

const defaultTemplate: StarterTemplate = {
  resourceName: 'Burimi i parë',
  resourceRole: 'Ofrues shërbimi',
  capacity: 1,
  serviceName: 'Shërbimi i parë',
  description: 'Model fillestar — ndryshoni emrin, kohëzgjatjen dhe çmimin.',
  durationMin: 60,
  price: 0,
  priceType: 'CUSTOM',
};

export const starterTemplateForCategory = (categorySlug: string): StarterTemplate =>
  templates[categorySlug] ?? defaultTemplate;
