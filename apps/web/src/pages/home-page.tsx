import { ArrowRight, BadgeCheck, Building2, CalendarCheck2, CheckCircle2, ChevronRight, Clock3, MapPin, Search, Sparkles, Store, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';
import { useI18n } from '../lib/i18n';
import { Seo, rezervoSiteUrl } from '../components/seo';

const categories = [
  { sq: 'Hotele & akomodim', en: 'Hotels & stays', slug: 'hotels', mark: '01' },
  { sq: 'Taksi & transfer', en: 'Taxi & transfers', slug: 'taxi-transport', mark: '02' },
  { sq: 'Bukuri & mirëqenie', en: 'Beauty & wellness', slug: 'beauty-salons', mark: '03' },
  { sq: 'Klinika & shëndetësi', en: 'Healthcare', slug: 'health-clinics', mark: '04' },
  { sq: 'Restorante', en: 'Restaurants', slug: 'restaurants', mark: '05' },
  { sq: 'Fitness & sport', en: 'Fitness & sport', slug: 'fitness', mark: '06' },
  { sq: 'Evente & hapësira', en: 'Events & venues', slug: 'events-venues', mark: '07' },
  { sq: 'Shërbime auto', en: 'Car services', slug: 'car-service', mark: '08' },
];

function BookingScene({ tr }: { tr: (sq: string, en: string) => string }) {
  return (
    <div className="home-booking-scene" aria-label={tr('Shembull i rezervimit online', 'Online booking example')}>
      <div aria-hidden className="home-scene-glow" />
      <div className="home-device">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-indigo-600">rezervo</p><h2 className="mt-1 text-base font-extrabold text-slate-950">{tr('Zgjidh terminin', 'Choose your time')}</h2></div><span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"><CalendarCheck2 size={19} /></span></div>
        <div className="p-5"><div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,.06)]"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><MapPin size={18} /></span><span><b className="block text-sm text-slate-900">Blend Barber</b><small className="text-slate-500">Prishtinë · Berber</small></span></div><div className="mt-4 grid grid-cols-3 gap-2"><span className="rounded-xl border border-indigo-100 bg-indigo-50 px-2 py-2.5 text-center text-xs font-bold text-indigo-700">10:00</span><span className="home-selected-slot rounded-xl bg-indigo-600 px-2 py-2.5 text-center text-xs font-bold text-white">10:30</span><span className="rounded-xl border border-indigo-100 bg-indigo-50 px-2 py-2.5 text-center text-xs font-bold text-indigo-700">11:00</span></div><div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-900"><span className="font-bold">{tr('Koha u ruajt', 'Time saved')}</span><CheckCircle2 size={16} /></div></div>
      </div>
      <div className="home-float-card home-confirm-card"><span className="grid size-9 place-items-center rounded-xl bg-teal-400 text-slate-950"><CheckCircle2 size={18} /></span><span><b>{tr('E konfirmuar', 'Confirmed')}</b><small>10:30 · Sot</small></span></div>
      <div className="home-float-card home-queue-card"><p>{tr('RADHËN E KE', 'YOU ARE NEXT')}</p><b>{tr('Pa pritje', 'No waiting')}</b></div>
    </div>
  );
}

export function HomePage() {
  const { tr } = useI18n();
  const steps = [
    { icon: Search, title: tr('Gjej', 'Find'), text: tr('Zgjidh kategorinë dhe biznesin që të përshtatet.', 'Choose the category and business that suit you.') },
    { icon: Clock3, title: tr('Zgjidh kohën', 'Choose a time'), text: tr('Shiko kohët reale e çmimin para rezervimit.', 'See real times and pricing before you book.') },
    { icon: CalendarCheck2, title: tr('Konfirmo', 'Confirm'), text: tr('Merr konfirmimin dhe menaxho termin në email.', 'Receive confirmation and manage your booking by email.') },
  ];
  return (
    <>
      <Seo title="Rezervo - Rezervime online në Kosovë" description="Gjeni, krahasoni dhe rezervoni hotele, berberë, taksi, klinika, restorante dhe shërbime në Kosovë." canonical={rezervoSiteUrl} structuredData={{ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'Rezervo', url: rezervoSiteUrl, areaServed: { '@type': 'Country', name: 'Kosovo' } }, { '@type': 'WebSite', name: 'Rezervo', url: rezervoSiteUrl, potentialAction: { '@type': 'SearchAction', target: `${rezervoSiteUrl}/businesses?q={search_term_string}`, 'query-input': 'required name=search_term_string' } }] }} />
      <SiteHeader />
      <main className="home-shell">
        <div aria-hidden className="home-grid" /><div aria-hidden className="home-orb home-orb-one" /><div aria-hidden className="home-orb home-orb-two" />
        <section className="page-shell relative py-16 sm:py-24 lg:py-28"><div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16"><div className="home-reveal max-w-2xl"><p className="home-chip"><Sparkles size={14} /> {tr('Rezervimi, pa stres', 'Booking, without stress')}</p><h1 className="home-title mt-6">{tr('Koha jote,', 'Your time,')} <span>{tr('në vendin e duhur.', 'in the right place.')}</span></h1><p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">{tr('Gjej një hotel, berber, taksi, klinikë ose restorant. Shiko kohët e lira dhe kryeje rezervimin në pak hapa.', 'Find a hotel, barber, taxi, clinic or restaurant. See available times and finish booking in just a few steps.')}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/businesses"><Button size="lg" className="home-primary-button w-full sm:w-auto"><Search size={17} /> {tr('Gjej biznesin', 'Find a business')} <ArrowRight size={16} /></Button></Link><Link to="/for-business"><Button size="lg" variant="secondary" className="home-secondary-button w-full sm:w-auto"><Building2 size={17} /> {tr('Kam biznes', 'I own a business')}</Button></Link></div><div className="home-proof mt-10"><span><BadgeCheck size={18} /> {tr('Konfirmim në email', 'Email confirmation')}</span><span><Clock3 size={18} /> {tr('Disponueshmëri reale', 'Real-time availability')}</span></div></div><div className="home-reveal home-delay-1"><BookingScene tr={tr} /></div></div></section>
        <section className="page-shell relative pb-6 sm:pb-12"><div className="home-trust-strip"><span><CheckCircle2 /> {tr('Rezervo online', 'Book online')}</span><span><CheckCircle2 /> {tr('Shiko çmimin para konfirmimit', 'See the price before confirmation')}</span><span><CheckCircle2 /> {tr('Menaxho terminin nga emaili', 'Manage your booking from email')}</span></div></section>
        <section className="page-shell relative py-16 sm:py-20"><div className="home-section-heading"><div><p className="home-kicker">{tr('Eksploro sipas nevojës', 'Explore by need')}</p><h2>{tr('Zgjidh ku dëshiron të rezervosh.', 'Choose where you want to book.')}</h2></div><Link to="/businesses" className="home-text-link">{tr('Të gjitha kategoritë', 'All categories')} <ArrowRight size={16} /></Link></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category, index) => <Link key={category.slug} to={`/businesses?category=${category.slug}`} className="home-category-card" style={{ animationDelay: `${index * 55}ms` }}><span className="home-category-number">{category.mark}</span><span className="home-category-dot" /><h3>{tr(category.sq, category.en)}</h3><span>{tr('Shiko bizneset', 'View businesses')} <ChevronRight size={15} /></span></Link>)}</div></section>
        <section className="page-shell relative py-12 sm:py-16"><div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]"><article className="home-story-card home-reveal"><p className="home-kicker">{tr('E thjeshtë për klientin', 'Simple for customers')}</p><h2>{tr('Tre hapa. Një termin i qartë.', 'Three steps. One clear appointment.')}</h2><p>{tr('Pa telefonata të panevojshme dhe pa mesazhe të humbura. Vetëm koha, çmimi dhe konfirmimi që të duhen.', 'No unnecessary calls or lost messages. Just the time, price and confirmation you need.')}</p><div className="mt-7 flex items-center gap-3 text-sm font-bold text-cyan-200"><span className="grid size-9 place-items-center rounded-xl bg-cyan-300 text-slate-950">✓</span>{tr('Çdo detaj ruhet në rezervimin tënd.', 'Every detail stays with your booking.')}</div></article><div className="grid gap-3 sm:grid-cols-3">{steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="home-step-card" style={{ animationDelay: `${index * 110}ms` }}><div><span>0{index + 1}</span><Icon size={19} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
        <section className="page-shell relative py-12 sm:py-16"><Link to="/blend-barber" className="home-feature-card group"><div className="home-feature-image"><div className="home-feature-overlay" /><span>★ {tr('Biznes i promovuar', 'Featured business')}</span><div><p>Prishtinë · Berber</p><h2>Blend Barber</h2></div></div><div className="flex flex-col justify-center p-7 sm:p-10"><p className="home-kicker">{tr('Rezervo direkt', 'Book directly')}</p><h2>{tr('Stil i mirë. Termin i sigurt.', 'Great style. A reliable appointment.')}</h2><p className="mt-4 leading-7 text-slate-300">{tr('Prerje moderne, fade dhe rregullim mjekre. Shiko oraret e lira dhe rezervo menjëherë.', 'Modern cuts, fades and beard grooming. View open times and book immediately.')}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 transition group-hover:translate-x-1">{tr('Rezervo te Blend Barber', 'Book at Blend Barber')} <ArrowRight size={17} /></span></div></Link></section>
        <section className="page-shell relative py-16 sm:py-20"><div className="home-business-cta"><div><p className="home-kicker text-cyan-200">{tr('Ke biznes?', 'Own a business?')}</p><h2>{tr('Faqja jote e rezervimeve, gati për klientët.', 'Your booking page, ready for customers.')}</h2><p>{tr('Shto shërbimet, ekipin, dhomat ose automjetet dhe organizo çdo rezervim nga një panel i vetëm.', 'Add services, team, rooms or vehicles and organize every booking from one dashboard.')}</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Link to="/for-business"><Button size="lg" className="w-full bg-white text-indigo-950 hover:bg-cyan-50"><Store size={17} /> {tr('Hape biznesin', 'Create your business')}</Button></Link><Link to="/businesses" className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-cyan-100 hover:text-white"><UsersRound size={17} /> {tr('Zbulo bizneset', 'Explore businesses')}</Link></div></div></section>
      </main>
      <footer className="home-footer"><div className="page-shell flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Rezervo</span><div className="flex flex-wrap gap-x-5 gap-y-2 font-medium"><Link to="/terms">{tr('Kushtet', 'Terms')}</Link><Link to="/privacy">{tr('Privatësia', 'Privacy')}</Link><Link to="/contact">{tr('Kontakt', 'Contact')}</Link></div></div></footer>
    </>
  );
}
