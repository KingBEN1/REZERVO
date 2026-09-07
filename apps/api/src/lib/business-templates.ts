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
