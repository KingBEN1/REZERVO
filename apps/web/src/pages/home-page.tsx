import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Store,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';
import { useI18n } from '../lib/i18n';

const categories = [
  { sq: 'Hotele & akomodim', en: 'Hotels & stays', slug: 'hotels' },
  { sq: 'Taksi & transfer', en: 'Taxi & transfers', slug: 'taxi-transport' },
  { sq: 'Bukuri & mirëqenie', en: 'Beauty & wellness', slug: 'beauty-salons' },
  { sq: 'Klinika & shëndetësi', en: 'Healthcare', slug: 'health-clinics' },
  { sq: 'Restorante', en: 'Restaurants', slug: 'restaurants' },
  { sq: 'Fitness & sport', en: 'Fitness & sport', slug: 'fitness' },
  { sq: 'Evente & hapësira', en: 'Events & venues', slug: 'events-venues' },
  { sq: 'Shërbime auto', en: 'Car services', slug: 'car-service' },
];

export function HomePage() {
  const { tr } = useI18n();
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-[#f7faf8] text-slate-950">
        <section className="relative border-b border-emerald-950/10 bg-[radial-gradient(circle_at_85%_10%,rgba(81,181,147,.22),transparent_27rem),radial-gradient(circle_at_18%_85%,rgba(193,229,213,.6),transparent_28rem)] py-12 sm:py-20">
          <div className="page-shell grid items-center gap-12 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-800/15 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[.14em] text-emerald-800 shadow-sm">
                <Sparkles size={14} /> {tr('Rezervime më të thjeshta', 'Simpler bookings')}
              </p>
              <h1 className="display mt-6 text-5xl font-bold leading-[.98] tracking-[-.045em] text-slate-950 sm:text-6xl lg:text-7xl">
                {tr('Koha jote vlen.', 'Your time matters.')}{' '}
                <span className="text-emerald-700">{tr('Rezervo lehtë.', 'Book with ease.')}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {tr(
                  'Gjej shërbimin e duhur, shiko kohën e lirë dhe konfirmo termin — pa telefonata e pa pritje.',
                  'Find the right service, see open times and confirm your appointment — without calls or waiting.',
                )}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/businesses">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Search size={17} /> {tr('Gjej biznesin', 'Find a business')} <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/for-business">
                  <Button size="lg" variant="secondary" className="w-full border-emerald-900/15 bg-white sm:w-auto">
                    {tr('Kam biznes', 'I own a business')}
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-700" /> {tr('Konfirmim në email', 'Email confirmation')}</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-700" /> {tr('Pa pagesë për klientin', 'Free for customers')}</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div aria-hidden className="absolute -inset-5 rounded-[2.4rem] bg-emerald-600/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-4 shadow-[0_28px_70px_rgba(20,74,57,.17)] sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">{tr('Gjej terminin tënd', 'Find your appointment')}</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight">{tr('Kërko sipas nevojës', 'Search by what you need')}</h2>
                  </div>
                  <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CalendarCheck2 size={22} /></span>
                </div>
                <div className="mt-5 grid gap-3">
                  <Link to="/businesses" className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                    <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Search size={18} /></span>
                    <span className="min-w-0 flex-1"><b className="block text-sm">{tr('Çfarë po kërkon?', 'What are you looking for?')}</b><small className="block truncate text-slate-500">{tr('Hotel, berber, taksi, dentist…', 'Hotel, barber, taxi, dentist…')}</small></span>
                    <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                  </Link>
                  <Link to="/businesses?category=hotels" className="group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50">
                    <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><MapPin size={18} /></span>
                    <span className="min-w-0 flex-1"><b className="block text-sm">{tr('Ku dëshiron të shkosh?', 'Where would you like to go?')}</b><small className="block truncate text-slate-500">{tr('Shiko bizneset pranë teje', 'Browse businesses nearby')}</small></span>
                    <ArrowRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                  </Link>
                </div>
                <Link to="/businesses" className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900">
                  {tr('Eksploro të gjitha bizneset', 'Explore all businesses')} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20">
          <div className="page-shell">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow text-emerald-700">{tr('Në qendër të vëmendjes', 'In the spotlight')}</p>
                <h2 className="display mt-2 text-3xl font-bold tracking-[-.035em] sm:text-4xl">{tr('Biznes i promovuar', 'Featured business')}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{tr('Zgjedhje të veçuara që e bëjnë më të lehtë të gjesh shërbimin e duhur.', 'A curated choice that makes it easier to find the right service.')}</p>
              </div>
              <Link to="/businesses" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-600">{tr('Shiko të gjitha', 'View all')} <ArrowRight size={16} /></Link>
            </div>
            <Link to="/blend-barber" className="group mt-8 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[0_20px_55px_rgba(15,23,42,.15)] lg:grid-cols-[1.05fr_.95fr]">
              <div className="relative min-h-72 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-amber-950">★ {tr('I promovuar', 'Featured')}</span>
              </div>
              <div className="flex flex-col justify-center p-7 text-white sm:p-10">
                <p className="text-xs font-extrabold uppercase tracking-[.15em] text-emerald-300">Prishtinë · Berber</p>
                <h3 className="display mt-3 text-4xl font-bold tracking-[-.04em]">Blend Barber</h3>
                <p className="mt-4 max-w-md leading-7 text-slate-300">{tr('Prerje moderne, fade dhe rregullim mjekre. Shiko kohën e lirë dhe rezervo menjëherë.', 'Modern cuts, fades and beard grooming. Check open times and book instantly.')}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-emerald-200">{tr('Rezervo te Blend Barber', 'Book at Blend Barber')} <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span>
              </div>
            </Link>
          </div>
        </section>

        <section className="border-y border-emerald-950/10 bg-[#edf6f1] py-14 sm:py-20">
          <div className="page-shell">
            <div className="max-w-2xl">
              <p className="eyebrow text-emerald-700">{tr('Eksploro sipas nevojës', 'Explore by need')}</p>
              <h2 className="display mt-2 text-3xl font-bold tracking-[-.035em] sm:text-4xl">{tr('Çfarë dëshiron të rezervosh?', 'What would you like to book?')}</h2>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link key={category.slug} to={`/businesses?category=${category.slug}`} className="group flex min-h-28 flex-col justify-between rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md">
                  <span className="font-bold text-slate-900">{tr(category.sq, category.en)}</span>
                  <span className="mt-4 flex items-center gap-2 text-sm font-bold text-emerald-700">{tr('Shiko bizneset', 'Browse')} <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-20">
          <div className="page-shell grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
            <div>
              <p className="eyebrow text-emerald-700">{tr('E qartë nga fillimi', 'Clear from the start')}</p>
              <h2 className="display mt-2 text-3xl font-bold tracking-[-.035em] sm:text-4xl">{tr('Tre hapa. Një termin i konfirmuar.', 'Three steps. One confirmed appointment.')}</h2>
              <p className="mt-4 max-w-md leading-7 text-slate-600">{tr('Më pak mesazhe, më pak telefonata dhe gjithçka që të duhet para se të niseni.', 'Fewer messages, fewer calls, and everything you need before you go.')}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Search, title: tr('Gjej', 'Find'), text: tr('Kërko biznesin ose kategorinë që të duhet.', 'Search for the business or category you need.') },
                { icon: Clock3, title: tr('Zgjidh kohën', 'Choose a time'), text: tr('Shiko disponueshmërinë reale dhe çmimin.', 'See real availability and pricing.') },
                { icon: CalendarCheck2, title: tr('Konfirmo', 'Confirm'), text: tr('Merr detajet e rezervimit në email.', 'Get booking details in your email.') },
              ].map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="relative rounded-2xl border border-slate-200 p-5">
                  <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-100">0{index + 1}</span>
                  <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon size={20} /></span>
                  <h3 className="mt-6 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0d352b] py-14 text-white sm:py-20">
          <div className="page-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-300">{tr('Ke biznes?', 'Own a business?')}</p>
              <h2 className="display mt-3 text-3xl font-bold tracking-[-.035em] sm:text-4xl">{tr('Faqja jote e rezervimeve, gati për klientët.', 'Your booking page, ready for customers.')}</h2>
              <p className="mt-4 max-w-2xl leading-7 text-emerald-50/75">{tr('Shto shërbimet, ekipin ose dhomat dhe merr rezervime nga një faqe e qartë e profesionale.', 'Add your services, team or rooms and receive bookings from a clean, professional page.')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link to="/for-business"><Button size="lg" className="w-full bg-white text-emerald-950 hover:bg-emerald-50"><Store size={17} /> {tr('Hape biznesin', 'Create your business')}</Button></Link>
              <Link to="/businesses" className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-emerald-200 hover:text-white"><UsersRound size={17} /> {tr('Zbulo bizneset', 'Explore businesses')}</Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white py-8 text-slate-500">
        <div className="page-shell flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Rezervo</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
            <Link to="/terms" className="hover:text-emerald-800">{tr('Kushtet', 'Terms')}</Link>
            <Link to="/privacy" className="hover:text-emerald-800">{tr('Privatësia', 'Privacy')}</Link>
            <Link to="/contact" className="hover:text-emerald-800">{tr('Kontakt', 'Contact')}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
