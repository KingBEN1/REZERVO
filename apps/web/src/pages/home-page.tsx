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
  const steps = [
    { icon: Search, title: tr('Gjej', 'Find'), text: tr('Zgjidh biznesin ose kategorinë që të duhet.', 'Choose the business or category you need.') },
    { icon: Clock3, title: tr('Zgjidh kohën', 'Choose a time'), text: tr('Shiko kohët reale dhe çmimin para rezervimit.', 'See real times and pricing before booking.') },
    { icon: CalendarCheck2, title: tr('Konfirmo', 'Confirm'), text: tr('Merr detajet e rezervimit menjëherë në email.', 'Receive booking details in your email instantly.') },
  ];
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden bg-[#050914] text-white">
        <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#070d1a] py-14 sm:py-24">
          <div aria-hidden className="absolute -left-32 top-8 -z-10 size-[34rem] rounded-full bg-indigo-600/25 blur-[120px]" />
          <div aria-hidden className="absolute -right-20 bottom-0 -z-10 size-[32rem] rounded-full bg-teal-400/20 blur-[120px]" />
          <div aria-hidden className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="page-shell grid items-center gap-12 lg:grid-cols-[.92fr_1.08fr] lg:gap-16">
            <div className="relative z-10 max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.15em] text-cyan-100 shadow-lg backdrop-blur-xl">
                <Sparkles size={14} className="text-cyan-300" /> {tr('Rezervimi, pa stres', 'Booking, without the stress')}
              </p>
              <h1 className="display mt-6 text-5xl font-bold leading-[.96] tracking-[-.055em] sm:text-6xl lg:text-7xl">
                {tr('Gjej kohën', 'Find the time')}{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">{tr('tënde.', 'for you.')}</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                {tr('Një vend i thjeshtë për hotel, berber, taksi, klinikë, restorant dhe çdo shërbim që kërkon termin tënd.', 'One simple place for hotels, barbers, taxis, clinics, restaurants and every service that needs your time.')}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/businesses"><Button size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-lg shadow-indigo-500/25 hover:from-cyan-400 hover:to-indigo-400 sm:w-auto"><Search size={17} /> {tr('Gjej biznesin', 'Find a business')} <ArrowRight size={16} /></Button></Link>
                <Link to="/for-business"><Button size="lg" variant="secondary" className="w-full border-white/15 bg-white/10 text-white hover:bg-white/15 sm:w-auto">{tr('Kam biznes', 'I own a business')}</Button></Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-300">
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-300" /> {tr('Konfirmim në email', 'Email confirmation')}</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-300" /> {tr('Koha e lirë në kohë reale', 'Real-time availability')}</span>
              </div>
            </div>

            <div className="relative mx-auto h-[380px] w-full max-w-2xl sm:h-[460px] [perspective:1400px]">
              <div aria-hidden className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/25 blur-[85px]" />
              <div className="absolute inset-x-5 top-8 rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-[0_38px_90px_rgba(0,0,0,.45)] backdrop-blur-xl transition duration-700 sm:inset-x-12 sm:p-5 [transform:rotateX(7deg)_rotateY(-13deg)] [transform-style:preserve-3d] hover:[transform:rotateX(3deg)_rotateY(-5deg)]">
                <div className="overflow-hidden rounded-[1.35rem] bg-[#f8fbff] text-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-indigo-600">rezervo</p><h2 className="mt-1 text-base font-extrabold">{tr('Zgjidh terminin', 'Choose your time')}</h2></div><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white"><CalendarCheck2 size={19} /></span></div>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><MapPin size={18} /></span><span><b className="block text-sm">Blend Barber</b><small className="text-slate-500">Prishtinë · Berber</small></span></div>
                    <div className="mt-4 grid grid-cols-3 gap-2"><span className="rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-2 text-center text-xs font-bold text-indigo-700">10:00</span><span className="rounded-xl bg-indigo-600 px-2 py-2 text-center text-xs font-bold text-white shadow-md shadow-indigo-500/30">10:30</span><span className="rounded-xl border border-indigo-200 bg-indigo-50 px-2 py-2 text-center text-xs font-bold text-indigo-700">11:00</span></div>
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900"><span className="font-bold">{tr('Koha u ruajt', 'Time saved')}</span><span className="font-extrabold">✓</span></div>
                  </div>
                </div>
              </div>
              <div className="absolute -left-1 top-[62%] rounded-2xl border border-white/15 bg-[#101b31]/90 p-3 shadow-2xl backdrop-blur-xl sm:left-2 sm:p-4 [transform:translateZ(70px)_rotateY(18deg)]"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-teal-400 text-slate-950"><CheckCircle2 size={16} /></span><span><b className="block text-xs">{tr('E konfirmuar', 'Confirmed')}</b><small className="text-[10px] text-slate-300">10:30 · Sot</small></span></div></div>
              <div className="absolute bottom-1 right-0 rounded-2xl border border-white/15 bg-white/95 p-3 text-slate-950 shadow-2xl sm:right-3 sm:p-4 [transform:translateZ(90px)_rotateY(-12deg)]"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-indigo-600">{tr('Radhën e ke', 'You are next')}</p><p className="mt-1 text-sm font-extrabold">{tr('Pa pritje', 'No waiting')}</p></div>
            </div>
          </div>
        </section>

        <section className="relative bg-[#08111f] py-16 sm:py-24">
          <div aria-hidden className="absolute inset-0 opacity-25 [background-image:linear-gradient(135deg,transparent_48%,rgba(103,232,249,.12)_49%,transparent_50%)] [background-size:22px_22px]" />
          <div className="page-shell relative">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-amber-300">{tr('Në qendër të vëmendjes', 'In the spotlight')}</p><h2 className="display mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">{tr('Bizneset e promovuara', 'Featured businesses')}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{tr('Bizneset më të mira marrin një vend premium — të qartë, të bukur dhe direkt me rezervim.', 'The best businesses receive a premium place — clear, beautiful and ready to book.')}</p></div><Link to="/businesses" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-200 hover:text-white">{tr('Shiko bizneset', 'View businesses')} <ArrowRight size={16} /></Link></div>
            <Link to="/blend-barber" className="group mt-9 grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#101c30] shadow-[0_30px_70px_rgba(0,0,0,.28)] lg:grid-cols-[1.1fr_.9fr]">
              <div className="relative min-h-72 bg-[url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=85')] bg-cover bg-center"><div className="absolute inset-0 bg-gradient-to-t from-[#070d1a]/85 via-[#070d1a]/15 to-transparent" /><span className="absolute left-5 top-5 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-amber-950">★ {tr('I promovuar', 'Featured')}</span><div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-slate-950/45 p-4 backdrop-blur-md"><p className="text-xs font-bold text-cyan-200">Prishtinë · Berber</p><h3 className="display mt-1 text-3xl font-bold">Blend Barber</h3></div></div>
              <div className="flex flex-col justify-center p-7 sm:p-10"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-teal-300">{tr('Rezervo direkt', 'Book directly')}</p><h3 className="display mt-3 text-3xl font-bold tracking-[-.035em]">{tr('Prerje që përshtatet me stilin tënd.', 'A cut that matches your style.')}</h3><p className="mt-4 leading-7 text-slate-300">{tr('Prerje moderne, fade dhe rregullim mjekre. Zgjidh një kohë të lirë dhe lëre rezervimin të kryhet për pak sekonda.', 'Modern cuts, fades and beard grooming. Choose an open time and complete your booking in seconds.')}</p><span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">{tr('Rezervo te Blend Barber', 'Book at Blend Barber')} <ArrowRight size={17} className="transition group-hover:translate-x-1" /></span></div>
            </Link>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#050914] py-16 sm:py-24">
          <div className="page-shell"><div className="max-w-2xl"><p className="eyebrow text-cyan-300">{tr('Eksploro sipas nevojës', 'Explore by need')}</p><h2 className="display mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">{tr('Çfarë dëshiron të rezervosh?', 'What would you like to book?')}</h2></div><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category, index) => <Link key={category.slug} to={`/businesses?category=${category.slug}`} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[.09]"><span aria-hidden className="absolute -right-3 -top-6 text-7xl font-black text-white/[.035]">0{index + 1}</span><span className="relative block font-bold">{tr(category.sq, category.en)}</span><span className="relative mt-7 flex items-center gap-2 text-sm font-bold text-cyan-200">{tr('Eksploro', 'Explore')} <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span></Link>)}</div></div>
        </section>

        <section className="relative bg-[#08111f] py-16 sm:py-24"><div aria-hidden className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-indigo-600/10 to-transparent" /><div className="page-shell relative grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="eyebrow text-teal-300">{tr('E qartë nga fillimi', 'Clear from the start')}</p><h2 className="display mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">{tr('Tre hapa. Një termin i konfirmuar.', 'Three steps. One confirmed appointment.')}</h2><p className="mt-4 max-w-md leading-7 text-slate-300">{tr('Më pak mesazhe, më pak telefonata. Vetëm detajet që të duhen para se të niseni.', 'Fewer messages, fewer calls. Just the details you need before you go.')}</p></div><div className="grid gap-4 sm:grid-cols-3">{steps.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[.05] p-5 shadow-xl shadow-black/10"><span className="flex items-center justify-between text-xs font-extrabold text-slate-400"><span>0{index + 1}</span><Icon size={18} className="text-cyan-300" /></span><h3 className="mt-9 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></article>)}</div></div></section>

        <section className="bg-gradient-to-br from-indigo-700 via-[#134e59] to-[#07111f] py-16 sm:py-20"><div className="page-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-extrabold uppercase tracking-[.17em] text-cyan-200">{tr('Ke biznes?', 'Own a business?')}</p><h2 className="display mt-3 text-3xl font-bold tracking-[-.04em] sm:text-4xl">{tr('Bëje biznesin tënd të duket aq mirë sa shërbimi yt.', 'Make your business look as good as your service.')}</h2><p className="mt-4 max-w-2xl leading-7 text-cyan-50/80">{tr('Krijo faqen, shto shërbimet, ekipin ose dhomat dhe merr rezervime në një vend profesional.', 'Create your page, add services, team or rooms and take bookings in one professional place.')}</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Link to="/for-business"><Button size="lg" className="w-full bg-white text-indigo-950 hover:bg-cyan-50"><Store size={17} /> {tr('Hape biznesin', 'Create your business')}</Button></Link><Link to="/businesses" className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-cyan-100 hover:text-white"><UsersRound size={17} /> {tr('Zbulo bizneset', 'Explore businesses')}</Link></div></div></section>
      </main>
      <footer className="border-t border-white/10 bg-[#050914] py-8 text-slate-400"><div className="page-shell flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Rezervo</span><div className="flex flex-wrap gap-x-5 gap-y-2 font-medium"><Link to="/terms" className="hover:text-white">{tr('Kushtet', 'Terms')}</Link><Link to="/privacy" className="hover:text-white">{tr('Privatësia', 'Privacy')}</Link><Link to="/contact" className="hover:text-white">{tr('Kontakt', 'Contact')}</Link></div></div></footer>
    </>
  );
}
