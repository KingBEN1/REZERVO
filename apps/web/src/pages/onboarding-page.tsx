import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, CheckCircle2, Circle, CreditCard, ShieldCheck, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Logo } from '../components/site-header';
import { Button } from '../components/ui/button';
import { api, ApiError } from '../lib/api';

const schema = z.object({
  name: z.string().min(2, 'Shkruani emrin e biznesit.'),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Përdorni shkronja të vogla, numra dhe viza.').min(3),
  categoryId: z.string().min(1, 'Zgjidhni llojin e biznesit.'),
  city: z.string().min(2, 'Zgjidhni qytetin.'),
  phone: z.string().min(6, 'Shkruani numrin e telefonit.'),
  address: z.string().max(180).optional(),
  description: z.string().max(1200).optional(),
});
type Values = z.infer<typeof schema>;
type Category = { id: string; name: string; slug: string; icon: string | null };

const categoryDetails: Record<string, string> = {
  barbers: 'Termine për prerje, stilim dhe kujdes personal.',
  'beauty-salons': 'Estetikë, thonj, makeup dhe kujdes bukurie.',
  'spa-wellness': 'Masazh, spa dhe seanca relaksi.',
  'health-clinics': 'Vizita, kontrolle dhe konsultime mjekësore.',
  dentists: 'Kontrolle, trajtime dhe higjienë dentare.',
  physiotherapy: 'Terapi, rehabilitim dhe seanca fizioterapie.',
  fitness: 'Stërvitje personale, klasa dhe aktivitete sportive.',
  hotels: 'Dhoma, takime, ambiente dhe kërkesa për akomodim.',
  restaurants: 'Rezervime tavolinash, menu speciale dhe evente.',
  'taxi-transport': 'Udhëtime, transferime dhe rezervime automjetesh.',
  'car-service': 'Servis, larje, gomisteri dhe kontroll automjeti.',
  photography: 'Seanca foto, video dhe rezervime studioje.',
  'events-venues': 'Salla, data eventi dhe qira hapësirash.',
  education: 'Kurse, mësime individuale dhe konsultime.',
  'professional-services': 'Takime profesionale, konsultime dhe zyre.',
  'home-services': 'Vizita në shtëpi, mirëmbajtje dhe riparime.',
  'pet-care': 'Grooming, veterineri dhe kujdes për kafshë.',
  'legal-notary': 'Konsulta ligjore, dokumente dhe noter.',
  rentals: 'Qira automjetesh, pajisjesh ose hapësirash.',
  'tourism-activities': 'Ture, ekskursione dhe përvoja lokale.',
  coworking: 'Tavolina pune, zyra dhe salla takimesh.',
  'electronics-repair': 'Diagnostikim dhe riparim pajisjesh.',
  'child-care': 'Aktivitete, kurse dhe kujdes për fëmijë.',
  other: 'Për çdo shërbim tjetër që punon me termine.',
};

function CategoryGlyph({ icon }: { icon: string | null }) {
  const glyphs: Record<string, string> = { Scissors: '✂', Sparkles: '✦', HeartPulse: '♥', Stethoscope: '✚', Smile: '☺', Activity: '◌', Dumbbell: '◈', Hotel: '⌂', Utensils: '♨', CarTaxiFront: '▰', Car: '▱', Camera: '◉', PartyPopper: '✺', GraduationCap: '◆', BriefcaseBusiness: '▣', House: '⌂', PawPrint: '♧', Scale: '⚖', KeyRound: '⌑', Compass: '◉', MonitorCog: '▤', Wrench: '⌕', Baby: '◍', MoreHorizontal: '•••' };
  return <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-white text-sm font-bold text-forest shadow-sm">{glyphs[icon ?? ''] ?? '•'}</span>;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useQuery({ queryKey: ['me'], queryFn: () => api<{ user: { email: string; emailVerifiedAt: string | null; memberships: Array<{ business: { id: string } }> } }>('/auth/me'), refetchOnWindowFocus: true });
  const resend = useMutation({ mutationFn: () => api('/auth/resend-verification', { method: 'POST' }) });
  const categories = useQuery({ queryKey: ['business-categories'], queryFn: () => api<{ categories: Category[] }>('/public/categories') });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '', categoryId: '', city: '', phone: '', address: '', description: '' } });
  const mutation = useMutation({ mutationFn: (values: Values) => api<{ business: { id: string } }>('/business', { method: 'POST', body: JSON.stringify(values) }), onSuccess: ({ business }) => { localStorage.setItem('rezervo-business-id', business.id); navigate('/dashboard'); } });
  const selectedCategoryId = form.watch('categoryId');

  if (user.isLoading) return <div className="grid min-h-screen place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" /></div>;
  if (user.data?.user.memberships[0]) { localStorage.setItem('rezervo-business-id', user.data.user.memberships[0].business.id); navigate('/dashboard'); return null; }

  if (user.data && !user.data.user.emailVerifiedAt) return (
    <main className="min-h-screen bg-sand px-4 py-12">
      <section className="surface mx-auto max-w-lg p-7">
        <Logo />
        <ShieldCheck className="mt-8 text-forest" size={32} />
        <h1 className="mt-4 text-2xl font-bold">Verifiko emailin e llogarisë</h1>
        <p className="mt-3 text-slate-600">Para krijimit të biznesit, hap lidhjen e verifikimit që dërgohet te <strong>{user.data.user.email}</strong>.</p>
        <p className="mt-3 text-sm text-slate-500">Kodi për një rezervim verifikon vetëm atë rezervim. Për llogarinë e pronarit përdoret lidhja në email.</p>
        <Button className="mt-6 w-full" disabled={resend.isPending || resend.isSuccess} onClick={() => resend.mutate()}>{resend.isPending ? 'Po dërgohet…' : resend.isSuccess ? 'Lidhja u dërgua' : 'Dërgo lidhjen e verifikimit'}</Button>
        {resend.isSuccess && <p role="status" className="mt-3 text-sm text-forest">Kontrollo Inbox dhe Spam. Hape lidhjen dhe kliko “Verifiko emailin”, pastaj kthehu këtu.</p>}
        {resend.error && <p role="alert" className="mt-3 text-sm text-red-600">Nuk mundëm ta dërgojmë emailin. Provo përsëri pas pak.</p>}
        <Button variant="secondary" className="mt-3 w-full" disabled={user.isFetching} onClick={() => void user.refetch()}>E verifikova — vazhdo</Button>
        <Link to="/account" className="mt-5 block text-center text-sm text-forest">Kthehu te llogaria</Link>
      </section>
    </main>
  );

  return <main className="min-h-screen bg-sand"><header className="border-b border-line bg-white"><div className="page-shell flex h-16 items-center justify-between"><Logo /><span className="text-sm text-slate-500">Krijoni biznesin tuaj</span></div></header><div className="page-shell grid gap-8 py-10 lg:grid-cols-[260px_1fr] lg:py-16"><aside className="surface h-fit p-5"><p className="eyebrow">Konfigurimi</p><div className="mt-5 space-y-4">{['Të dhënat e biznesit', 'Shto shërbimet ose ofertat', 'Shto ekipin ose burimet', 'Vendos orarin dhe disponueshmërinë', 'Publiko faqen e rezervimeve'].map((item, index) => <div key={item} className={`flex items-center gap-3 text-sm ${index === 0 ? 'font-bold text-forest' : 'text-slate-400'}`}>{index === 0 ? <CheckCircle2 size={19} /> : <Circle size={19} />}{item}</div>)}</div><div className="mt-7 rounded-2xl bg-green-50 p-4"><ShieldCheck className="text-forest" size={20} /><p className="mt-3 text-sm font-bold text-forest">30 ditë falas</p><p className="mt-1 text-xs leading-5 text-green-800">Pastaj abonimi është 30 € në muaj. Pa pagesë sot dhe pa kontratë afatgjatë.</p></div></aside><section className="surface max-w-3xl p-6 sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-green-50 text-forest"><Building2 size={23} /></span><p className="eyebrow mt-6">Le të fillojmë</p><h1 className="display mt-2 text-3xl font-bold">Na tregoni për biznesin tuaj.</h1><p className="mt-3 text-slate-600">Krijoni një faqe rezervimi për çdo lloj shërbimi, nga salloni dhe klinika te hoteli, restoranti, taksi apo konsultimet profesionale.</p><div className="mt-6 flex gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"><CreditCard className="mt-0.5 shrink-0 text-forest" size={21} /><div><p className="font-bold text-forest">Muaji i parë është falas</p><p className="mt-1 text-sm leading-6 text-green-800">Aktivizoni biznesin pa kartelë. Pas 30 ditëve, plani Rezervo kushton 30 € në muaj dhe përfshin rezervime, faqe publike, kalendar, klientë dhe ekip/burime pa kufi.</p></div></div><form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="mt-8 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Emri i biznesit</span><input className="input" placeholder="p.sh. Hotel Dardania, Taxi Prishtina, Beauty Studio" {...form.register('name', { onChange: (event) => { if (!form.getValues('slug')) form.setValue('slug', event.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); } })} />{form.formState.errors.name && <small className="text-red-600">{form.formState.errors.name.message}</small>}</label><fieldset className="sm:col-span-2"><legend className="mb-1.5 text-sm font-semibold">Çfarë lloj biznesi keni?</legend><p className="mb-3 text-sm text-slate-500">Kjo na ndihmon ta përshtatim gjuhën dhe mënyrën si e përdorni Rezervo.</p>{categories.isLoading && <div className="grid gap-2 sm:grid-cols-2">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-sand" />)}</div>}{categories.isError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Kategoritë nuk u ngarkuan. Ekzekutoni <code>npm.cmd run db:seed</code> dhe rifreskoni faqen.</p>}{categories.data && <div className="grid gap-2 sm:grid-cols-2">{categories.data.categories.map((category) => <label key={category.id} className={`cursor-pointer rounded-2xl border p-3 transition ${selectedCategoryId === category.id ? 'border-forest bg-green-50 ring-1 ring-forest' : 'border-line bg-white hover:border-green-300'}`}><input className="sr-only" type="radio" value={category.id} {...form.register('categoryId')} /><span className="flex items-start gap-3"><CategoryGlyph icon={category.icon} /><span><b className="block text-sm">{category.name}</b><small className="mt-0.5 block leading-4 text-slate-500">{categoryDetails[category.slug] ?? 'Rezervime të thjeshta për klientët tuaj.'}</small></span></span></label>)}</div>}{form.formState.errors.categoryId && <small className="mt-2 block text-red-600">{form.formState.errors.categoryId.message}</small>}</fieldset><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Adresa e faqes</span><div className="flex"><span className="inline-flex h-11 items-center rounded-l-xl border border-r-0 border-line bg-sand px-3 text-sm text-slate-500">rezervo.app/book/</span><input className="input rounded-l-none" placeholder="hotel-dardania" {...form.register('slug')} /></div>{form.formState.errors.slug && <small className="text-red-600">{form.formState.errors.slug.message}</small>}</label><label><span className="mb-1.5 block text-sm font-semibold">Qyteti</span><select className="input" {...form.register('city')}><option value="">Zgjidh qytetin</option>{['Prishtinë', 'Ferizaj', 'Prizren', 'Gjilan', 'Pejë', 'Gjakovë', 'Mitrovicë', 'Podujevë', 'Vushtrri', 'Suharekë', 'Rahovec', 'Kamenicë', 'Deçan', 'Klinë', 'Lipjan', 'Malishevë', 'Skenderaj', 'Kaçanik', 'Dragash'].map((city) => <option key={city}>{city}</option>)}</select>{form.formState.errors.city && <small className="text-red-600">{form.formState.errors.city.message}</small>}</label><label><span className="mb-1.5 block text-sm font-semibold">Telefoni</span><input className="input" placeholder="+383 44 123 456" {...form.register('phone')} />{form.formState.errors.phone && <small className="text-red-600">{form.formState.errors.phone.message}</small>}</label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Adresa <small className="font-normal text-slate-400">(opsionale)</small></span><input className="input" placeholder="Rruga dhe numri" {...form.register('address')} /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-sm font-semibold">Çfarë mund të rezervojnë klientët? <small className="font-normal text-slate-400">(opsionale)</small></span><textarea className="input min-h-24 py-3" placeholder="p.sh. Dhoma hoteli, taksi për aeroport, kontroll mjekësor, tavolinë për darkë, prerje flokësh..." {...form.register('description')} /></label>{mutation.error && <p className="text-sm text-red-600 sm:col-span-2">{mutation.error instanceof ApiError ? mutation.error.message : 'Nuk mundëm të krijojmë biznesin.'}</p>}<div className="flex flex-col-reverse gap-3 pt-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><Link to="/" className="text-sm font-semibold text-slate-600">Ruaj për më vonë</Link><Button type="submit" disabled={mutation.isPending || categories.isLoading}>{mutation.isPending ? 'Duke ruajtur...' : <>Krijo biznesin falas <ArrowRight size={16} /></>}</Button></div></form><div className="mt-8 flex gap-3 rounded-xl bg-sand p-4 text-sm text-slate-600"><Sparkles className="shrink-0 text-forest" size={19} />Pasi ta krijoni biznesin, shtoni ofertat, njerëzit ose burimet (p.sh. dhoma, automjete, tavolina) dhe oraret kur pranoni rezervime.</div></section></div></main>;
}
