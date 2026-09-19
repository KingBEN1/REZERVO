import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, CalendarCheck, Check, CreditCard, HeartHandshake, MapPin, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { money } from '../lib/utils';

type Plan = { code: string; name: string; description: string | null; monthlyPrice: string; limits: Record<string, number>; features: string[] };
export function PricingPage() { const query = useQuery({ queryKey: ['plans'], queryFn: () => api<{ plans: Plan[] }>('/public/plans') }); return <><SiteHeader /><main className="page-shell py-14 sm:py-20"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Një plan i thjeshtë për çdo biznes</p><h1 className="display mt-3 text-4xl font-bold">30 ditët e para falas. Pastaj 30 € në muaj.</h1><p className="mt-4 text-slate-600">Për berberë, bukuri, hotele, restorante, taksi, klinika, automjete, evente dhe çdo biznes që pranon rezervime.</p></div><div className="mx-auto mt-8 flex max-w-2xl gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-left"><CreditCard className="mt-0.5 shrink-0 text-forest" size={22} /><p className="text-sm leading-6 text-green-900"><b>Pa kartelë sot.</b> Regjistrojeni biznesin, përdoreni platformën plotësisht për 30 ditë dhe paguani 30 € vetëm kur përfundon muaji i parë falas.</p></div>{query.isLoading && <div className="mx-auto mt-12 h-[430px] max-w-md animate-pulse rounded-3xl bg-white" />}{query.data && <div className="mx-auto mt-12 grid max-w-md gap-4">{query.data.plans.map((plan) => <article className="surface flex flex-col border-forest p-7 ring-1 ring-forest" key={plan.code}><span className="mb-4 w-fit rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-forest">Muaji i parë falas</span><h2 className="text-2xl font-bold">{plan.name}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{plan.description ?? 'Gjithçka që ju duhet për rezervime të organizuara.'}</p><p className="mt-6"><span className="text-4xl font-bold">{money(plan.monthlyPrice)}</span><span className="text-sm text-slate-500"> / muaj pas provës falas</span></p><p className="mt-2 text-sm font-semibold text-forest">Sot: 0 € · Ditët 1–30: falas</p><Link to="/register" className="mt-6"><Button className="w-full">Krijo biznesin falas</Button></Link><ul className="mt-6 space-y-3 border-t border-line pt-5 text-sm">{plan.features.map((feature) => <li className="flex gap-2" key={feature}><Check className="shrink-0 text-forest" size={17} />{feature}</li>)}</ul></article>)}</div>}{query.isError && <div className="mt-12"><EmptyState title="Planet nuk janë të disponueshme" detail="Provoni përsëri pas pak." action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>} /></div>}</main></>;
}
const legalContent: Record<string, { title: string; intro: string; sections: Array<[string, string]> }> = { terms: { title: 'Kushtet e përdorimit', intro: 'Kjo është një strukturë fillestare e kushteve të produktit dhe duhet të rishikohet nga këshilltar juridik para publikimit.', sections: [['Përdorimi i shërbimit', 'Rezervo u ofron bizneseve mjete për administrimin e rezervimeve. Bizneset mbeten përgjegjëse për saktësinë e të dhënave, politikat e tyre dhe komunikimin me klientët.'], ['Llogaritë', 'Përdoruesit duhet të ruajnë sigurinë e kredencialeve të tyre dhe të përdorin shërbimin vetëm sipas rolit të autorizuar.'], ['Ndryshimet', 'Kushtet mund të përditësohen me njoftim të arsyeshëm për përdoruesit.']] }, privacy: { title: 'Politika e privatësisë', intro: 'Kjo strukturë sqaron kategoritë e të dhënave që produkti mund të përpunojë; ajo kërkon rishikim juridik para lansimit.', sections: [['Të dhënat që përpunojmë', 'Përfshijnë detajet e llogarisë, të dhënat e biznesit dhe informacionin e rezervimit që përdoret për ofrimin e shërbimit.'], ['Përdorimi i të dhënave', 'Të dhënat përdoren për rezervime, siguri, mbështetje dhe komunikime të nevojshme për shërbimin. Integrimet analitike ose marketingu nuk duhet të ngarkohen para pëlqimit të duhur.'], ['Kërkesat e privatësisë', 'Përdoruesit mund të kërkojnë qasje ose fshirje të të dhënave të tyre, duke ruajtur të dhënat që kërkohen për arsye financiare ose auditimi.']] } };
export function LegalPage({ type }: { type: 'terms' | 'privacy' }) { const content = legalContent[type]!; return <><SiteHeader /><main className="page-shell max-w-3xl py-14 sm:py-20"><p className="eyebrow">Dokument produkti</p><h1 className="display mt-3 text-4xl font-bold">{content.title}</h1><p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{content.intro}</p>{content.sections.map(([heading, body]) => <section className="mt-9" key={heading}><h2 className="text-xl font-bold">{heading}</h2><p className="mt-3 leading-7 text-slate-600">{body}</p></section>)}</main></>;
}
export function SimplePage({ title, text }: { title: string; text: string }) { return <><SiteHeader /><main className="page-shell grid min-h-[60vh] place-items-center py-16"><section className="max-w-xl text-center"><ShieldCheck className="mx-auto text-forest" size={36} /><h1 className="display mt-5 text-4xl font-bold">{title}</h1><p className="mt-4 leading-7 text-slate-600">{text}</p><Link className="mt-7 inline-block" to="/"><Button>Kthehu në ballinë</Button></Link></section></main></>; }

export function AboutPage() {
  const { tr } = useI18n();
  const values = [
    {
      icon: CalendarCheck,
      title: tr('Rezervime pa pengesa', 'Bookings without friction'),
      text: tr('Nga kërkimi deri te konfirmimi, çdo hap duhet të jetë i qartë, i shpejtë dhe i sigurt.', 'From discovery to confirmation, every step should be clear, fast and secure.'),
    },
    {
      icon: HeartHandshake,
      title: tr('Teknologji që afron njerëzit', 'Technology that brings people together'),
      text: tr('Ne automatizojmë procesin, pa humbur marrëdhënien njerëzore mes biznesit dhe klientit.', 'We automate the process without losing the human relationship between a business and its customers.'),
    },
    {
      icon: ShieldCheck,
      title: tr('Besim në çdo rezervim', 'Trust in every booking'),
      text: tr('Verifikimi, komunikimi i qartë dhe kontrolli i të dhënave e bëjnë çdo rezervim më të besueshëm.', 'Verification, clear communication and data control make every booking more dependable.'),
    },
  ];
  const steps = [
    [tr('Klienti gjen biznesin', 'Customers discover a business'), tr('Kërkon sipas shërbimit, qytetit dhe nevojës së tij.', 'They search by service, city and what they need.')],
    [tr('Zgjedh kohën e përshtatshme', 'They choose the right time'), tr('Disponueshmëria, çmimi dhe detajet shfaqen qartë.', 'Availability, pricing and details are shown clearly.')],
    [tr('Biznesi menaxhon gjithçka', 'The business manages everything'), tr('Rezervimet, klientët, ekipi dhe ofertat qëndrojnë në një panel.', 'Bookings, customers, team members and offers live in one dashboard.')],
  ];
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden">
        <section className="relative border-b border-white/10 bg-forest py-20 text-white sm:py-28">
          <div className="tech-grid absolute inset-0 opacity-50" />
          <div className="absolute -left-24 top-10 size-80 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 size-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="page-shell relative grid items-center gap-12 lg:grid-cols-[1.12fr_.88fr]">
            <div className="max-w-3xl hero-reveal">
              <p className="eyebrow text-emerald-200">{tr('Rreth Rezervo', 'About Rezervo')}</p>
              <h1 className="display mt-5 text-4xl font-bold leading-[1.08] sm:text-6xl">
                {tr('Më pak kohë duke organizuar.', 'Less time spent organizing.')}<br />
                <span className="text-emerald-300">{tr('Më shumë kohë për njerëzit.', 'More time for people.')}</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-green-50/85">
                {tr('Rezervo është platforma kosovare që lidh klientët me bizneset që punojnë me termine. Po ndërtojmë një mënyrë më të thjeshtë për të gjetur, rezervuar dhe menaxhuar shërbime—nga një llogari e vetme.', 'Rezervo is a Kosovo-based platform connecting customers with businesses that work by appointment. We are building a simpler way to discover, book and manage services—from one account.')}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/businesses"><Button>{tr('Zbulo bizneset', 'Discover businesses')} <ArrowRight size={17} /></Button></Link>
                <Link to="/for-business"><Button variant="secondary">{tr('Zgjidhja për biznese', 'Solution for businesses')}</Button></Link>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md hero-reveal hero-delay-2">
              <div className="glass-panel lift-3d rounded-[2rem] p-6">
                <div className="flex items-center justify-between"><span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-200">REZERVO KS</span><Sparkles className="text-cyan-300" /></div>
                <div className="mt-10 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/10 p-4"><MapPin className="text-emerald-300" /><p className="mt-5 text-2xl font-bold">Kosovë</p><p className="mt-1 text-xs text-green-100/70">{tr('E ndërtuar për tregun tonë', 'Built for our market')}</p></div>
                  <div className="rounded-2xl bg-white/10 p-4"><UsersRound className="text-cyan-300" /><p className="mt-5 text-2xl font-bold">24/7</p><p className="mt-1 text-xs text-green-100/70">{tr('Rezervime pa telefonata', 'Bookings without phone calls')}</p></div>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-green-50/80">{tr('Një platformë. Çdo kategori biznesi. Një përvojë më e mirë për të gjithë.', 'One platform. Every business category. A better experience for everyone.')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-shell py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{tr('Pse ekzistojmë', 'Why we exist')}</p>
            <h2 className="display mt-4 text-3xl font-bold sm:text-5xl">{tr('Rezervimi nuk duhet të jetë i komplikuar.', 'Booking should not be complicated.')}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{tr('Shumë biznese ende humbin kohë me telefonata, mesazhe dhe kalendarë të shpërndarë. Klientët presin përgjigje dhe nuk e dinë gjithmonë kur ka vende të lira. Rezervo i bashkon këto pjesë në një përvojë të vetme dhe të kuptueshme.', 'Too many businesses still lose time to calls, messages and disconnected calendars. Customers wait for replies and cannot always see what is available. Rezervo brings those pieces together in one clear experience.')}</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }) => <article key={title} className="surface lift-3d p-6 sm:p-7"><span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-50 text-forest"><Icon size={22} /></span><h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}
          </div>
        </section>

        <section className="border-y border-line bg-white/70 py-16 sm:py-24">
          <div className="page-shell grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div><p className="eyebrow">{tr('Si funksionon', 'How it works')}</p><h2 className="display mt-4 text-3xl font-bold sm:text-5xl">{tr('Nga kërkimi te rezervimi, pa kaos.', 'From discovery to booking, without the chaos.')}</h2><p className="mt-5 leading-7 text-slate-600">{tr('Rezervo u jep klientëve qartësi dhe bizneseve kontroll—pa procese të panevojshme.', 'Rezervo gives customers clarity and businesses control—without unnecessary process.')}</p></div>
            <div className="space-y-4">{steps.map(([title, text], index) => <article key={title} className="surface flex gap-5 p-5 sm:p-6"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-forest font-bold text-white">{index + 1}</span><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></article>)}</div>
          </div>
        </section>

        <section className="page-shell py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-cyan-700 to-forest px-6 py-12 text-center text-white shadow-2xl sm:px-12 sm:py-16">
            <div className="tech-grid absolute inset-0 opacity-30" />
            <Building2 className="relative mx-auto text-emerald-200" size={34} />
            <h2 className="display relative mx-auto mt-5 max-w-3xl text-3xl font-bold sm:text-5xl">{tr('Po ndërtojmë infrastrukturën e rezervimeve për bizneset e Kosovës.', 'We are building booking infrastructure for Kosovo businesses.')}</h2>
            <p className="relative mx-auto mt-5 max-w-2xl leading-7 text-cyan-50/85">{tr('Pavarësisht nëse menaxhoni një sallon, klinikë, hotel, restorant, transport apo shërbim profesional, Rezervo ju ndihmon të dukeni profesional dhe të punoni më qartë.', 'Whether you run a salon, clinic, hotel, restaurant, transport company or professional service, Rezervo helps you look professional and operate with clarity.')}</p>
            <Link className="relative mt-8 inline-block" to="/register?intent=business"><Button>{tr('Krijo biznesin falas', 'Create your business for free')} <ArrowRight size={17} /></Button></Link>
          </div>
        </section>
      </main>
    </>
  );
}
