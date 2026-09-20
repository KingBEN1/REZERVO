import {
  ArrowRight,
  CalendarCheck2,
  Heart,
  MapPin,
  ShieldCheck,
  Store,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';
import { useI18n } from '../lib/i18n';

const categories = [
  { sq: 'Hotele', en: 'Hotels', slug: 'hotels' },
  { sq: 'Taksi & transfer', en: 'Taxi & transfers', slug: 'taxi-transport' },
  { sq: 'Bukuri', en: 'Beauty', slug: 'beauty-salons' },
  { sq: 'Shëndetësi', en: 'Healthcare', slug: 'health-clinics' },
  { sq: 'Restorante', en: 'Restaurants', slug: 'restaurants' },
  { sq: 'Fitness', en: 'Fitness', slug: 'fitness' },
  { sq: 'Evente', en: 'Events', slug: 'events-venues' },
  { sq: 'Shërbime auto', en: 'Car services', slug: 'car-service' },
];

export function HomePage() {
  const { tr } = useI18n();
  const benefits = [
    tr('Disponueshmëri në kohë reale', 'Real-time availability'),
    tr('Vlerësime nga klientë të verifikuar', 'Reviews from verified customers'),
    tr('Lidhje e sigurt për anulim ose ndryshim', 'Secure link to cancel or reschedule'),
    tr('Preferenca dhe sugjerime personale', 'Personal preferences and recommendations'),
  ];
  return (
    <>
      <SiteHeader />
      <main>
        <section className="tech-grid relative isolate overflow-hidden bg-[#07111f] pb-16 pt-14 text-white sm:pb-24 sm:pt-20">
          <div aria-hidden className="absolute -left-32 -top-28 -z-10 size-[30rem] rounded-full bg-indigo-600/30 blur-3xl" />
          <div aria-hidden className="absolute -right-24 bottom-0 -z-10 size-[32rem] rounded-full bg-cyan-400/20 blur-3xl" />
          <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-48 w-48 -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="page-shell relative">
            <div className="mx-auto max-w-3xl text-center">
              <p className="hero-reveal mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-cyan-200 shadow-xl backdrop-blur-xl">
                {tr('Rezervo shpejt. Shko pa stres.', 'Book quickly. Arrive stress-free.')}
              </p>
              <h1 className="hero-reveal hero-delay-1 display mx-auto mt-5 max-w-4xl text-[2.55rem] font-bold leading-[1.04] tracking-[-.025em] text-white sm:text-6xl lg:text-7xl">
                {tr('Gjej, krahaso dhe', 'Find, compare and')}{' '}<span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">{tr('rezervo', 'book')}</span>{' '}{tr('online.', 'online.')}
              </h1>
              <p className="hero-reveal hero-delay-2 mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {tr(
                  'Hotele, taksi, bukuri, klinika, restorante dhe shërbime pranë jush — me disponueshmëri, çmime dhe konfirmim të qartë.',
                  'Hotels, taxis, beauty salons, clinics, restaurants and nearby services — with clear availability, pricing and confirmation.',
                )}
              </p>
              <div className="hero-reveal hero-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/businesses">
                  <Button size="lg" className="w-full sm:w-auto">
                    {tr('Gjej një rezervim', 'Find a booking')} <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    {tr('Krijo llogari klienti', 'Create customer account')}
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                {tr('Rezervim i sigurt · Menaxho terminin nga llogaria jote', 'Secure booking · Manage it from your account')}
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Preview
                icon={MapPin}
                title={tr('Gjej pranë teje', 'Find nearby')}
                text={tr('Kërko sipas qytetit, kategorisë, çmimit dhe vlerësimit.', 'Search by city, category, price and rating.')}
              />
              <Preview
                icon={CalendarCheck2}
                title={tr('Rezervo në kohë reale', 'Book in real time')}
                text={tr('Zgjidh datën, orën ose qëndrimin dhe merr konfirmim.', 'Choose a date, time or stay and receive confirmation.')}
              />
              <Preview
                icon={Heart}
                title={tr('Ruaj të preferuarat', 'Save favorites')}
                text={tr('Kthehu te bizneset që të pëlqejnë nga llogaria jote.', 'Return to your favorite businesses from your account.')}
              />
            </div>
          </div>
        </section>
        <section className="page-shell py-4 sm:py-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-100 via-white to-cyan-100 p-1 shadow-xl">
            <div className="relative grid gap-6 rounded-[1.85rem] bg-white/75 p-6 backdrop-blur sm:grid-cols-[1fr_260px] sm:p-9">
              <div>
                <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">★ {tr('Biznes i promovuar', 'Featured business')}</p>
                <h2 className="display mt-4 text-3xl font-bold text-ink">Blend Barber</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{tr('Prerje moderne, fade dhe rregullim mjekre në Prishtinë. Shiko oraret e lira dhe rezervo menjëherë.', 'Modern cuts, fades and beard grooming in Prishtina. See free times and book instantly.')}</p>
                <Link to="/blend-barber" className="mt-5 inline-block"><Button>{tr('Rezervo te Blend Barber', 'Book Blend Barber')} <ArrowRight size={16} /></Button></Link>
              </div>
              <div className="relative min-h-40 overflow-hidden rounded-2xl bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-4 left-4 text-sm font-bold text-white">Prishtinë · Berber</p>
              </div>
            </div>
          </div>
        </section>
        <section className="page-shell py-16 sm:py-24">
          <p className="eyebrow">{tr('Eksploro sipas nevojës', 'Explore by need')}</p>
          <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
            {tr('Çfarë dëshiron të rezervosh?', 'What would you like to book?')}
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.sq}
                to={`/businesses?category=${category.slug}`}
                className="surface lift-3d group flex items-center justify-between p-5 hover:border-indigo-200"
              >
                <span className="font-bold">{tr(category.sq, category.en)}</span>
                <ArrowRight className="text-forest transition group-hover:translate-x-1" size={18} />
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-ink py-16 text-white sm:py-20">
          <div className="page-shell">
            <div className="mx-auto max-w-4xl text-center">
              <p className="eyebrow text-green-300">{tr('E thjeshtë për klientin', 'Simple for customers')}</p>
              <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
                {tr('Kërko, zgjidh dhe menaxho çdo rezervim nga një llogari e vetme.', 'Search, choose and manage every booking from one account.')}
              </h2>
              <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                {benefits.map((text) => (
                  <p key={text} className="flex gap-3 text-sm text-green-50">
                    <ShieldCheck className="shrink-0 text-green-300" size={18} />
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="page-shell py-16 sm:py-24">
          <div className="surface lift-3d relative grid gap-6 overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_58%,#ecfeff_100%)] p-7 sm:grid-cols-[1fr_auto] sm:p-10">
            <div>
              <p className="eyebrow">{tr('Ke biznes?', 'Own a business?')}</p>
              <h2 className="display mt-2 text-3xl font-bold">{tr('Hape faqen tënde të rezervimeve.', 'Launch your booking page.')}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {tr('Shtoni ofertat, dhomat, automjetet ose ekipin tuaj. Merrni 30 ditë falas për ta provuar platformën.', 'Add your offers, rooms, vehicles or team. Try the platform free for 30 days.')}
              </p>
              <Link to="/for-business" className="mt-6 inline-block">
                <Button>
                  {tr('Shiko zgjidhjen për biznese', 'See the business solution')} <Store size={16} />
                </Button>
              </Link>
            </div>
            <div className="flex items-end gap-3 text-forest">
              <Store size={38} />
              <Star size={32} />
              <CalendarCheck2 size={42} />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line py-8">
        <div className="page-shell flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Rezervo</span>
          <div className="flex gap-4">
            <Link to="/terms">{tr('Kushtet', 'Terms')}</Link>
            <Link to="/privacy">{tr('Privatësia', 'Privacy')}</Link>
            <Link to="/contact">{tr('Kontakt', 'Contact')}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function Preview({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin;
  title: string;
  text: string;
}) {
  return (
    <article className="glass-panel lift-3d rounded-3xl p-6 text-left">
      <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">
        <Icon className="text-cyan-200" size={22} />
      </span>
      <h2 className="mt-4 font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
    </article>
  );
}
