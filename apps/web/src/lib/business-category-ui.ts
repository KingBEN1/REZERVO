export type BusinessCategoryUi = {
  servicePlural: string;
  serviceSingular: string;
  resourcePlural: string;
  resourceSingular: string;
  serviceExample: string;
  resourceExample: string;
  onboarding: string;
};

const fallback: BusinessCategoryUi = {
  servicePlural: 'Shërbimet', serviceSingular: 'shërbim', resourcePlural: 'Ekipi', resourceSingular: 'anëtar ekipi',
  serviceExample: 'Konsultë', resourceExample: 'Ofruesi i parë', onboarding: 'Vendosni shërbimet dhe ekipin që klientët mund t’i rezervojnë.',
};

const categories: Record<string, BusinessCategoryUi> = {
  hotels: { servicePlural: 'Dhomat & qëndrimet', serviceSingular: 'dhomë ose qëndrim', resourcePlural: 'Dhomat', resourceSingular: 'dhomë', serviceExample: 'Dhomë dyshe standarde', resourceExample: 'Dhoma 101', onboarding: 'Shtoni dhomat, kapacitetin, çmimet për natë dhe orarin e pritjes.' },
  restaurants: { servicePlural: 'Tavolinat & rezervimet', serviceSingular: 'rezervim tavoline', resourcePlural: 'Tavolinat', resourceSingular: 'tavolinë', serviceExample: 'Drekë për dy persona', resourceExample: 'Tavolina 4', onboarding: 'Shtoni tavolinat, kapacitetin dhe oraret e shërbimit.' },
  barbers: { servicePlural: 'Shërbimet', serviceSingular: 'shërbim', resourcePlural: 'Berberët', resourceSingular: 'berber', serviceExample: 'Prerje flokësh', resourceExample: 'Ardit Berberi', onboarding: 'Shtoni shërbimet, berberët dhe kohëzgjatjen e secilit termin.' },
  'beauty-salons': { servicePlural: 'Trajtimet', serviceSingular: 'trajtim', resourcePlural: 'Stilistët', resourceSingular: 'stilist', serviceExample: 'Manikyr xhel', resourceExample: 'Era Stiliste', onboarding: 'Shtoni trajtimet, stilistët dhe kohën e nevojshme për secilin.' },
  'spa-wellness': { servicePlural: 'Trajtimet', serviceSingular: 'trajtim', resourcePlural: 'Terapistët', resourceSingular: 'terapist', serviceExample: 'Masazh relaksues', resourceExample: 'Terapisti 1', onboarding: 'Shtoni trajtimet, terapistët dhe hapësirat e wellness-it.' },
  'health-clinics': { servicePlural: 'Shërbimet mjekësore', serviceSingular: 'shërbim mjekësor', resourcePlural: 'Mjekët & dhomat', resourceSingular: 'mjek ose dhomë', serviceExample: 'Kontrollë mjekësore', resourceExample: 'Dr. Arben', onboarding: 'Shtoni shërbimet, mjekët dhe dhomat e vizitave.' },
  dentists: { servicePlural: 'Shërbimet dentare', serviceSingular: 'shërbim dentar', resourcePlural: 'Dentistët', resourceSingular: 'dentist', serviceExample: 'Kontrollë dentare', resourceExample: 'Dr. Lira', onboarding: 'Shtoni shërbimet dentare, dentistët dhe karriget e punës.' },
  physiotherapy: { servicePlural: 'Seancat', serviceSingular: 'seancë', resourcePlural: 'Fizioterapistët', resourceSingular: 'fizioterapist', serviceExample: 'Seancë fizioterapie', resourceExample: 'Fizioterapisti 1', onboarding: 'Shtoni seancat, fizioterapistët dhe hapësirat e trajtimit.' },
  fitness: { servicePlural: 'Klasat & seancat', serviceSingular: 'klasë ose seancë', resourcePlural: 'Trajnerët', resourceSingular: 'trajner', serviceExample: 'Trajnim personal', resourceExample: 'Trajneri 1', onboarding: 'Shtoni klasat, trajnerët dhe kapacitetin e secilës seancë.' },
  'taxi-transport': { servicePlural: 'Udhëtimet & transferet', serviceSingular: 'udhëtim ose transfer', resourcePlural: 'Automjetet', resourceSingular: 'automjet', serviceExample: 'Transfer aeroporti', resourceExample: 'Taksi 01', onboarding: 'Shtoni automjetet, transferet dhe kapacitetin e pasagjerëve.' },
  'car-service': { servicePlural: 'Shërbimet e servisimit', serviceSingular: 'shërbim servisimi', resourcePlural: 'Vendet e punës', resourceSingular: 'vend pune', serviceExample: 'Ndërrim vajrash', resourceExample: 'Servisi 1', onboarding: 'Shtoni shërbimet dhe vendet e punës për automjete.' },
  photography: { servicePlural: 'Paketat', serviceSingular: 'paketë', resourcePlural: 'Fotografët', resourceSingular: 'fotograf', serviceExample: 'Fotosesion portreti', resourceExample: 'Fotografi 1', onboarding: 'Shtoni paketat, fotografët dhe pajisjet që mund të rezervohen.' },
  'events-venues': { servicePlural: 'Paketat & datat', serviceSingular: 'paketë eventi', resourcePlural: 'Hapësirat', resourceSingular: 'hapësirë', serviceExample: 'Dasmë në sallë', resourceExample: 'Salla kryesore', onboarding: 'Shtoni sallat, kapacitetin dhe paketat për evente.' },
  education: { servicePlural: 'Kurset & konsultat', serviceSingular: 'kurs ose konsultë', resourcePlural: 'Instruktorët', resourceSingular: 'instruktor', serviceExample: 'Konsultë 1:1', resourceExample: 'Instruktori 1', onboarding: 'Shtoni kurset, instruktorët dhe oraret e mësimit.' },
  rentals: { servicePlural: 'Artikujt për qira', serviceSingular: 'artikull për qira', resourcePlural: 'Pajisjet & automjetet', resourceSingular: 'pajisje ose automjet', serviceExample: 'Makinë me qira', resourceExample: 'Automjeti 1', onboarding: 'Shtoni artikujt për qira, sasinë dhe çmimin e tyre.' },
  'tourism-activities': { servicePlural: 'Turet & aktivitetet', serviceSingular: 'tur ose aktivitet', resourcePlural: 'Guidat', resourceSingular: 'guidë', serviceExample: 'Tur në Prizren', resourceExample: 'Guida 1', onboarding: 'Shtoni aktivitetet, guidat dhe kapacitetin për pjesëmarrës.' },
  coworking: { servicePlural: 'Hapësirat & paketat', serviceSingular: 'hapësirë ose paketë', resourcePlural: 'Zyrat & tavolinat', resourceSingular: 'zyrë ose tavolinë', serviceExample: 'Tavolinë ditore', resourceExample: 'Zyra 1', onboarding: 'Shtoni zyrat, tavolinat dhe paketat e coworking-ut.' },
  'electronics-repair': { servicePlural: 'Shërbimet e riparimit', serviceSingular: 'shërbim riparimi', resourcePlural: 'Teknikët', resourceSingular: 'teknik', serviceExample: 'Riparim telefoni', resourceExample: 'Tekniku 1', onboarding: 'Shtoni riparimet, teknikët dhe vendet e punës.' },
  'child-care': { servicePlural: 'Aktivitetet', serviceSingular: 'aktivitet', resourcePlural: 'Edukatorët', resourceSingular: 'edukator', serviceExample: 'Aktivitet pas shkolle', resourceExample: 'Edukatori 1', onboarding: 'Shtoni aktivitetet, edukatorët dhe numrin maksimal të fëmijëve.' },
  'pet-care': { servicePlural: 'Shërbimet për kafshë', serviceSingular: 'shërbim për kafshë', resourcePlural: 'Kujdestarët', resourceSingular: 'kujdestar', serviceExample: 'Larje për qen', resourceExample: 'Kujdestari 1', onboarding: 'Shtoni shërbimet, kujdestarët dhe hapësirat për kafshët.' },
  'legal-notary': { servicePlural: 'Konsultat & terminet', serviceSingular: 'konsultë ose termin', resourcePlural: 'Profesionistët', resourceSingular: 'profesionist', serviceExample: 'Konsultë ligjore', resourceExample: 'Avokati 1', onboarding: 'Shtoni konsultat, avokatët/noterët dhe oraret e takimeve.' },
  'professional-services': { servicePlural: 'Konsultat', serviceSingular: 'konsultë', resourcePlural: 'Profesionistët', resourceSingular: 'profesionist', serviceExample: 'Konsultë biznesi', resourceExample: 'Konsulenti 1', onboarding: 'Shtoni shërbimet, profesionistët dhe kohët e takimeve.' },
  'home-services': { servicePlural: 'Vizitat në terren', serviceSingular: 'vizitë në terren', resourcePlural: 'Ekipet', resourceSingular: 'ekip', serviceExample: 'Pastrimi i banesës', resourceExample: 'Ekipi 1', onboarding: 'Shtoni shërbimet në terren, ekipet dhe zonat e mbulimit.' },
};

export function categoryUi(slug?: string | null): BusinessCategoryUi {
  return (slug && categories[slug]) || fallback;
}
