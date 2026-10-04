import {
  ArrowRight,
  CalendarCheck2,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
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
        <section className="tech-grid relative isolate overflow-hidden bg-[#07111f] py-12 text-white sm:py-20">
          <div
            aria-hidden
            className="absolute -left-32 -top-28 -z-10 size-[30rem] rounded-full bg-indigo-600/30 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -right-24 bottom-0 -z-10 size-[32rem] rounded-full bg-cyan-400/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-1/3 -z-10 h-48 w-48 -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl"
          />
          <div className="page-shell relative grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="hero-reveal inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-cyan-200 shadow-xl backdrop-blur-xl">
                {tr('Rezervo shpejt. Shko pa stres.', 'Book quickly. Arrive stress-free.')}
              </p>
              <h1 className="hero-reveal hero-delay-1 display mt-5 text-[2.7rem] font-bold leading-[1.02] tracking-[-.035em] text-white sm:text-6xl">
                {tr('Gjej, krahaso dhe', 'Find, compare and')}{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                  {tr('rezervo', 'book')}
                </span>{' '}
                {tr('online.', 'online.')}
              </h1>
              <p className="hero-reveal hero-delay-2 mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                {tr(
                  'Hotele, taksi, bukuri, klinika, restorante dhe shërbime pranë jush — me disponueshmëri, çmime dhe konfirmim të qartë.',
                  'Hotels, taxis, beauty salons, clinics, restaurants and nearby services — with clear availability, pricing and confirmation.',
                )}
              </p>
              <div className="hero-reveal hero-delay-3 mt-8 flex flex-col gap-3 sm:flex-row">
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
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 border-t border-white/10 pt-5 text-xs text-slate-300 sm:gap-4">
                <Link to="/businesses?category=hotels" className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"><MapPin size={17} className="mb-2 text-cyan-300" /><b className="block text-white">{tr('Pranë teje', 'Nearby')}</b><span>{tr('Biznese lokale', 'Local businesses')}</span></Link>
                <Link to="/businesses" className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"><CalendarCheck2 size={17} className="mb-2 text-cyan-300" /><b className="block text-white">{tr('Në kohë reale', 'Real time')}</b><span>{tr('Orar i lirë', 'Free slots')}</span></Link>
                <Link to="/account" className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"><Heart size={17} className="mb-2 text-cyan-300" /><b className="block text-white">{tr('Një llogari', 'One account')}</b><span>{tr('Menaxho lehtë', 'Manage easily')}</span></Link>
              </div>
            </div>
            <div className="hero-reveal hero-delay-2 relative mx-auto w-full max-w-lg">
              <div aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-cyan-400/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                <div className="rounded-[1.35rem] bg-white p-4 text-slate-900 shadow-xl sm:p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div><p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">{tr('Rezervim i thjeshtë', 'Simple booking')}</p><h2 className="mt-1 text-lg font-extrabold">{tr('Gjithçka në një vend', 'Everything in one place')}</h2></div>
                    <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarCheck2 size={21} /></span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span><span><b className="block text-sm">{tr('Zgjidh biznesin', 'Choose a business')}</b><small className="text-slate-500">{tr('Sipas qytetit ose kategorisë', 'By city or category')}</small></span></div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><span className="grid size-8 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span><span><b className="block text-sm">{tr('Zgjidh kohën', 'Choose a time')}</b><small className="text-slate-500">{tr('Shih çmimin para konfirmimit', 'See price before confirming')}</small></span></div>
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3"><span className="grid size-8 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</span><span><b className="block text-sm">{tr('Merr konfirmimin', 'Receive confirmation')}</b><small className="text-emerald-800">{tr('Direkt në email', 'Directly by email')}</small></span></div>
                  </div>
                  <Link to="/businesses" className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"><span>{tr('Shiko bizneset', 'Browse businesses')}</span><ArrowRight size={17} /></Link>
                </div>
                <p className="px-2 pt-4 text-center text-xs text-cyan-100">{tr('Disponueshmëri, çmim dhe konfirmim i qartë.', 'Availability, price and clear confirmation.')}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="bg-slate-950 py-14 text-white sm:py-20">
          <div className="page-shell">
            <p className="eyebrow text-amber-300">
              {tr('Vendi yt në qendër të vëmendjes', 'Your place in the spotlight')}
            </p>
            <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="display text-3xl font-bold sm:text-4xl">
                  {tr('Bizneset e promovuara', 'Promoted businesses')}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  {tr(
                    'Bizneset e promovuara shfaqen në main page dhe në krye të kërkimit.',
                    'Promoted businesses appear on the main page and at the top of search.',
                  )}
                </p>
              </div>
              <Link to="/promote">
                <Button variant="secondary">
                  {tr('Promovo biznesin', 'Promote your business')} <Sparkles size={16} />
                </Button>
              </Link>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
              <Link
                to="/blend-barber"
                className="group relative min-h-[22rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/5" />
                <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-amber-950">
                  ★ {tr('Biznes i promovuar', 'Featured business')}
                </span>
                <div className="absolute inset-x-5 bottom-5">
                  <h3 className="display mt-2 text-3xl font-bold">Blend Barber</h3>
                  <p className="mt-2 text-sm text-slate-200">
                    {tr(
                      'Prishtinë · Prerje, fade dhe mjekër',
                      'Prishtina · Cuts, fades and beard grooming',
                    )}
                  </p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">{tr('Shiko oraret e lira', 'See available times')} <ArrowRight size={16} /></span>
                </div>
              </Link>
              <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-6 backdrop-blur-sm">
                <span className="grid size-11 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-200"><Sparkles size={20} /></span>
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[.16em] text-cyan-300">{tr('Për biznese', 'For businesses')}</p>
                <h3 className="display mt-2 text-2xl font-bold">{tr('Bëhu më i dukshëm.', 'Be more visible.')}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{tr('Vendosni biznesin tuaj në zonën premium të faqes kryesore dhe në krye të rezultateve të kërkimit.', 'Place your business in the premium area of the home page and at the top of search results.')}</p>
                <ul className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm text-slate-200"><li className="flex gap-2"><span className="text-emerald-300">✓</span>{tr('Shfaqje në faqen kryesore', 'Home page visibility')}</li><li className="flex gap-2"><span className="text-emerald-300">✓</span>{tr('Pozicion më i mirë në kërkim', 'Higher search position')}</li><li className="flex gap-2"><span className="text-emerald-300">✓</span>{tr('Profil dhe buton rezervimi', 'Profile and booking button')}</li></ul>
                <Link to="/promote" className="mt-6 inline-flex text-sm font-bold text-cyan-200 hover:text-white">{tr('Mëso për promovimin', 'Learn about promotion')} <ArrowRight className="ml-2" size={16} /></Link>
              </div>
            </div>
          </div>
        </section>
        <section className="page-shell py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">{tr('Eksploro sipas nevojës', 'Explore by need')}</p>
          <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
            {tr('Çfarë dëshiron të rezervosh?', 'What would you like to book?')}
          </h2><p className="mt-3 text-sm leading-6 text-slate-500">{tr('Gjeni biznesin e duhur sipas shërbimit që kërkoni.', 'Find the right business based on the service you need.')}</p></div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.sq}
                to={`/businesses?category=${category.slug}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_7px_20px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_16px_30px_rgba(15,23,42,.10)]"
              >
                <span className="font-bold">{tr(category.sq, category.en)}</span>
                <ArrowRight
                  className="text-forest transition group-hover:translate-x-1"
                  size={18}
                />
              </Link>
            ))}
          </div>
        </section>
        <section className="page-shell pb-16 sm:pb-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0a1728] px-6 py-10 text-white shadow-[0_22px_55px_rgba(15,23,42,.16)] sm:px-10 sm:py-14">
            <div aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <div>
              <p className="eyebrow text-green-300">
                {tr('E thjeshtë për klientin', 'Simple for customers')}
              </p>
              <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
                {tr(
                  'Kërko, zgjidh dhe menaxho çdo rezervim nga një llogari e vetme.',
                  'Search, choose and manage every booking from one account.',
                )}
              </h2>
              </div>
              <div className="grid gap-3 text-left sm:grid-cols-2">
                {benefits.map((text) => (
                  <p key={text} className="flex gap-3 rounded-xl border border-white/10 bg-white/[.06] p-4 text-sm text-green-50">
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
              <h2 className="display mt-2 text-3xl font-bold">
                {tr('Hape faqen tënde të rezervimeve.', 'Launch your booking page.')}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                {tr(
                  'Shtoni ofertat, dhomat, automjetet ose ekipin tuaj. Merrni 30 ditë falas për ta provuar platformën.',
                  'Add your offers, rooms, vehicles or team. Try the platform free for 30 days.',
                )}
              </p>
              <Link to="/for-business" className="mt-6 inline-block">
                <Button>
                  {tr('Shiko zgjidhjen për biznese', 'See the business solution')}{' '}
                  <Store size={16} />
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
