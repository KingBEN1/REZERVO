import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api } from '../lib/api';
import { dateTime, money } from '../lib/utils';

type Membership = {
  role: string;
  business: { id: string; name: string; slug: string; status: string };
};
type Me = { user: { firstName: string; platformRole: string | null; memberships: Membership[] } };
type DashboardData = {
  todayBookings: number;
  customerCount: number;
  revenue: string;
  upcoming: Array<{
    id: string;
    startAt: string;
    status: string;
    customer: { name: string };
    service: { name: string };
    staff: { name: string };
  }>;
};
type SetupData = {
  business: {
    status: string;
    slug: string;
    name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    settings: unknown;
    verification: {
      status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
      legalName: string;
      registrationNumber: string;
      contactName: string;
      contactPhone: string;
      website: string | null;
      reviewNote: string | null;
    } | null;
    _count: { services: number; staff: number };
  };
};
const nav = [
  { to: '/dashboard', end: true, icon: LayoutDashboard, label: 'Paneli' },
  { to: '/dashboard/calendar', icon: CalendarDays, label: 'Kalendari' },
  { to: '/dashboard/bookings', icon: ClipboardList, label: 'Rezervimet' },
  { to: '/dashboard/customers', icon: Users, label: 'Klientët' },
  { to: '/dashboard/services', icon: Scissors, label: 'Shërbimet / ofertat' },
  { to: '/dashboard/promotions', icon: BadgePercent, label: 'Kuponet & ofertat' },
  { to: '/dashboard/staff', icon: Users, label: 'Ekipi / burimet' },
  { to: '/dashboard/hours', icon: Clock3, label: 'Orari i punës' },
  { to: '/dashboard/profile', icon: Settings, label: 'Profili & rregullat' },
  { to: '/dashboard/billing', icon: CreditCard, label: 'Abonimi' },
];
export function useTenant() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me'), retry: false });
  const saved = localStorage.getItem('rezervo-business-id');
  const membership =
    me.data?.user.memberships.find((item) => item.business.id === saved) ??
    me.data?.user.memberships[0];
  return { ...me, membership };
}
export function DashboardLayout() {
  const { data, membership, isLoading } = useTenant();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
    },
  });
  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  if (!data) {
    navigate('/login?intent=business');
    return null;
  }
  if (!membership) {
    navigate('/for-business');
    return null;
  }
  localStorage.setItem('rezervo-business-id', membership.business.id);
  const sidebar = (
    <>
      <div className="flex items-center justify-between px-3 py-4">
        <Link to="/" className="text-lg font-bold">
          rezervo
        </Link>
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Mbyll menunë"
        >
          <X />
        </button>
      </div>
      <div className="mx-3 rounded-xl bg-green-50 p-3">
        <p className="truncate text-sm font-bold text-forest">{membership.business.name}</p>
        <p className="mt-0.5 text-xs text-green-700">{membership.role.replace('_', ' ')}</p>
      </div>
      <nav className="mt-5 space-y-1 px-3">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            end={end}
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-forest text-white' : 'text-slate-600 hover:bg-sand hover:text-ink'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-line p-3">
        <Link
          to={`/book/${membership.business.slug}`}
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-sand"
        >
          <ExternalLink size={18} />
          Faqja e rezervimeve
        </Link>
        <button
          onClick={() => logout.mutate()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-sand"
        >
          <LogOut size={18} />
          Dil
        </button>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-sand">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-y-auto border-r border-line bg-white lg:flex">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex bg-ink/30 lg:hidden">
          <aside className="flex w-72 flex-col overflow-y-auto bg-white shadow-xl">{sidebar}</aside>
          <button
            className="flex-1"
            aria-label="Mbyll menunë"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
      <main className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-sand/90 px-4 backdrop-blur sm:px-7">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden" aria-label="Hap menunë">
            <Menu />
          </button>
          <span className="hidden text-sm text-slate-500 lg:block">Europe/Pristina · EUR</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:inline">{data.user.firstName}</span>
            <span className="grid size-9 place-items-center rounded-full bg-forest text-sm font-bold text-white">
              {data.user.firstName.slice(0, 1)}
            </span>
          </div>
        </header>
        <div className="p-4 sm:p-7">
          <Outlet context={{ tenantId: membership.business.id, membership }} />
        </div>
      </main>
    </div>
  );
}
export function DashboardHome() {
  const { membership } = useTenant();
  const tenantId = membership?.business.id;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['dashboard', tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => api<DashboardData>('/business/dashboard', {}, tenantId),
  });
  const setup = useQuery({
    queryKey: ['business-current', tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => api<SetupData>('/business/current', {}, tenantId),
  });
  const hours = useQuery({
    queryKey: ['working-hours', tenantId],
    enabled: Boolean(tenantId),
    queryFn: () => api<{ hours: Array<{ isOpen: boolean }> }>('/business/hours', {}, tenantId),
  });
  const publish = useMutation({
    mutationFn: () => api('/business/current/publish', { method: 'PATCH' }, tenantId),
    onSuccess: () => client.invalidateQueries({ queryKey: ['business-current'] }),
  });
  if (query.isLoading || setup.isLoading || hours.isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="h-28 animate-pulse rounded-3xl bg-white" key={index} />
        ))}
      </div>
    );
  if (!query.data)
    return (
      <EmptyState
        title="Nuk arritëm t’i ngarkojmë të dhënat"
        detail="Provoni përsëri pas pak."
        action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>}
      />
    );
  const data = query.data;
  const business = setup.data?.business;
  const hasHours = Boolean(hours.data?.hours.some((item) => item.isOpen));
  const setupItems = business
    ? [
        {
          label: 'Plotëso profilin',
          done: Boolean(business.description && business.phone && business.address),
          to: '/dashboard/profile',
        },
        {
          label: 'Shto ofertën e parë',
          done: business._count.services > 0,
          to: '/dashboard/services',
        },
        {
          label: 'Shto ekipin ose burimin',
          done: business._count.staff > 0,
          to: '/dashboard/staff',
        },
        { label: 'Vendos orarin e punës', done: hasHours, to: '/dashboard/hours' },
        {
          label: 'Dërgo verifikimin e biznesit',
          done: business.verification?.status === 'APPROVED',
          to: '/dashboard',
        },
      ]
    : [];
  const ready = business && business._count.services > 0 && business._count.staff > 0 && hasHours;
  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Përmbledhje</p>
          <h1 className="display mt-1 text-3xl font-bold">Paneli juaj</h1>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/staff">
            <Button variant="secondary" size="sm">
              <Plus size={15} /> Ekip / burim
            </Button>
          </Link>
          <Link to="/dashboard/services">
            <Button size="sm">
              <Plus size={15} /> Ofertë
            </Button>
          </Link>
        </div>
      </div>
      {business?.status !== 'ACTIVE' && (
        <section className="surface mt-6 max-w-3xl overflow-hidden">
          <div className="bg-green-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-bold text-forest">Përgatit faqen tuaj për publikim</p>
                <p className="mt-1 text-sm text-green-900">
                  Përfundoni hapat më poshtë dhe më pas bëjeni faqen e rezervimeve të dukshme për
                  klientët.
                </p>
              </div>
              <Button
                disabled={
                  !ready || business.verification?.status !== 'APPROVED' || publish.isPending
                }
                onClick={() => publish.mutate()}
              >
                {publish.isPending ? 'Duke dërguar...' : 'Kërko aktivizim'}
              </Button>
            </div>
            {publish.error && (
              <p className="mt-3 text-sm text-red-700">
                {publish.error instanceof Error
                  ? publish.error.message
                  : 'Nuk mundëm ta publikojmë.'}
              </p>
            )}
          </div>
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {setupItems.map((item) => (
              <Link
                to={item.to}
                key={item.label}
                className="flex items-center gap-3 p-4 text-sm hover:bg-sand"
              >
                <CheckCircle2 size={19} className={item.done ? 'text-forest' : 'text-slate-300'} />
                <span className={item.done ? 'font-semibold text-ink' : 'text-slate-600'}>
                  {item.label}
                </span>
                <span className="ml-auto text-xs font-semibold text-forest">
                  {item.done ? 'Gati' : 'Plotëso →'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      {business && business.verification?.status !== 'APPROVED' && (
        <VerificationForm
          business={business}
          tenantId={tenantId!}
          onSaved={() => client.invalidateQueries({ queryKey: ['business-current'] })}
        />
      )}
      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Stat label="Rezervime në 7 ditë" value={String(data.todayBookings)} icon={CalendarDays} />
        <Stat label="Klientë gjithsej" value={String(data.customerCount)} icon={Users} />
        <Stat label="Të ardhura sot" value={money(data.revenue)} icon={BarChart3} />
      </div>
      <section className="surface mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold">Rezervimet e ardhshme</h2>
            <p className="mt-1 text-sm text-slate-500">Terminet që kërkojnë vëmendjen tuaj.</p>
          </div>
          <Link to="/dashboard/bookings" className="text-sm font-semibold text-forest">
            Shiko të gjitha
          </Link>
        </div>
        {data.upcoming.length ? (
          <div className="mt-5 divide-y divide-line">
            {data.upcoming.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-2 py-4 sm:grid-cols-[160px_1fr_auto] sm:items-center"
              >
                <span className="text-sm font-semibold text-forest">
                  {dateTime(booking.startAt)}
                </span>
                <span>
                  <b className="block text-sm">{booking.customer.name}</b>
                  <small className="text-slate-500">
                    {booking.service.name} · {booking.staff.name}
                  </small>
                </span>
                <span className="w-fit rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-forest">
                  {booking.status === 'CONFIRMED' ? 'Konfirmuar' : 'Në pritje'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Ende nuk ka rezervime"
              detail="Publikoni faqen e rezervimeve për të filluar."
            />
          </div>
        )}
      </section>
    </>
  );
}

function VerificationForm({
  business,
  tenantId,
  onSaved,
}: {
  business: NonNullable<SetupData['business']>;
  tenantId: string;
  onSaved: () => void;
}) {
  const [values, setValues] = useState({
    legalName: business.verification?.legalName ?? business.name,
    registrationNumber: business.verification?.registrationNumber ?? '',
    contactName: business.verification?.contactName ?? '',
    contactPhone: business.verification?.contactPhone ?? business.phone ?? '',
    website: business.verification?.website ?? '',
    confirmAuthority: false,
    confirmAccurate: false,
  });
  const submit = useMutation({
    mutationFn: () =>
      api(
        '/business/current/verification',
        { method: 'POST', body: JSON.stringify(values) },
        tenantId,
      ),
    onSuccess: onSaved,
  });
  const status = business.verification?.status;
  if (status === 'SUBMITTED')
    return (
      <section className="surface mt-6 max-w-3xl border border-amber-200 p-5">
        <p className="font-bold text-amber-900">Verifikimi është në shqyrtim</p>
        <p className="mt-1 text-sm text-amber-800">
          Administratori do të kontrollojë të dhënat dhe do ta aktivizojë biznesin tuaj.
        </p>
      </section>
    );
  return (
    <section className="surface mt-6 max-w-3xl p-5 sm:p-6">
      <p className="eyebrow">Siguria e platformës</p>
      <h2 className="mt-1 text-xl font-bold">Verifiko biznesin para publikimit</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Këto të dhëna përdoren vetëm nga administratori për të kontrolluar që biznesi është real. Pa
        këtë hap, faqja nuk shfaqet publikisht.
      </p>
      {status === 'REJECTED' && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Kërkesa e fundit kërkon korrigjim:{' '}
          {business.verification?.reviewNote ?? 'Kontrolloni të dhënat dhe dërgojeni përsëri.'}
        </p>
      )}
      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit.mutate();
        }}
      >
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Emri ligjor i biznesit</span>
          <input
            required
            className="input"
            value={values.legalName}
            onChange={(event) => setValues({ ...values, legalName: event.target.value })}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Numri i regjistrimit / NUI</span>
          <input
            required
            className="input"
            placeholder="p.sh. 8112345"
            value={values.registrationNumber}
            onChange={(event) => setValues({ ...values, registrationNumber: event.target.value })}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Personi përgjegjës</span>
          <input
            required
            className="input"
            value={values.contactName}
            onChange={(event) => setValues({ ...values, contactName: event.target.value })}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">Telefon kontakti</span>
          <input
            required
            className="input"
            value={values.contactPhone}
            onChange={(event) => setValues({ ...values, contactPhone: event.target.value })}
          />
        </label>
        <label>
          <span className="mb-1 block text-sm font-medium">
            Faqe interneti <small className="text-slate-400">(opsionale)</small>
          </span>
          <input
            className="input"
            type="url"
            placeholder="https://..."
            value={values.website}
            onChange={(event) => setValues({ ...values, website: event.target.value })}
          />
        </label>
        <label className="sm:col-span-2 flex gap-3 text-sm">
          <input
            required
            type="checkbox"
            checked={values.confirmAuthority}
            onChange={(event) => setValues({ ...values, confirmAuthority: event.target.checked })}
          />
          <span>Konfirmoj se jam i autorizuar të përfaqësoj këtë biznes.</span>
        </label>
        <label className="sm:col-span-2 flex gap-3 text-sm">
          <input
            required
            type="checkbox"
            checked={values.confirmAccurate}
            onChange={(event) => setValues({ ...values, confirmAccurate: event.target.checked })}
          />
          <span>Konfirmoj se të dhënat e dërguara janë të sakta.</span>
        </label>
        {submit.error && (
          <p className="sm:col-span-2 text-sm text-red-700">
            {submit.error instanceof Error ? submit.error.message : 'Verifikimi nuk u dërgua.'}
          </p>
        )}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={submit.isPending}>
            {submit.isPending ? 'Duke dërguar...' : 'Dërgo për verifikim'}
          </Button>
        </div>
      </form>
    </section>
  );
}

type BillingData = {
  business: {
    name: string;
    subscription: {
      status: string;
      trialEnd: string | null;
      currentPeriodEnd: string | null;
      plan: { name: string; monthlyPrice: string; features: string[] };
    } | null;
  };
};
export function BillingPage() {
  const { membership } = useTenant();
  const query = useQuery({
    queryKey: ['billing', membership?.business.id],
    enabled: Boolean(membership),
    queryFn: () => api<BillingData>('/business/current', {}, membership!.business.id),
  });
  if (query.isLoading) return <div className="h-80 animate-pulse rounded-3xl bg-white" />;
  if (!query.data?.business.subscription)
    return (
      <EmptyState
        title="Abonimi nuk u gjet"
        detail="Kontaktoni mbështetjen nëse sapo e keni krijuar biznesin."
        action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>}
      />
    );
  const subscription = query.data.business.subscription;
  const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
  const trialing =
    subscription.status === 'TRIALING' && trialEnd && trialEnd.getTime() > Date.now();
  const daysRemaining = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400_000))
    : 0;
  const formattedTrialEnd = trialEnd
    ? new Intl.DateTimeFormat('sq-XK', { dateStyle: 'long', timeZone: 'Europe/Belgrade' }).format(
        trialEnd,
      )
    : '—';
  return (
    <>
      <div>
        <p className="eyebrow">Abonimi dhe pagesa</p>
        <h1 className="display mt-1 text-3xl font-bold">Plani juaj Rezervo</h1>
        <p className="mt-2 text-slate-500">
          Menaxhoni periudhën falas dhe pagesën mujore të biznesit tuaj.
        </p>
      </div>
      <section className="surface mt-7 max-w-2xl overflow-hidden">
        <div className="bg-green-50 p-6">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 text-forest" size={24} />
            <div>
              <p className="font-bold text-forest">
                {trialing ? 'Muaji i parë është falas' : 'Abonimi Rezervo'}
              </p>
              <p className="mt-1 text-sm leading-6 text-green-900">
                {trialing
                  ? `Ju kanë mbetur ${daysRemaining} ditë pa pagesë. Periudha falas përfundon më ${formattedTrialEnd}.`
                  : 'Plani juaj përfshin të gjitha funksionet e rezervimeve.'}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plani</p>
            <p className="mt-1 text-lg font-bold">{subscription.plan.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Çmimi pas provës falas
            </p>
            <p className="mt-1 text-lg font-bold">{money(subscription.plan.monthlyPrice)} / muaj</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Statusi</p>
            <p className="mt-1 font-semibold text-forest">
              {trialing
                ? 'Në provë falas'
                : subscription.status === 'ACTIVE'
                  ? 'Aktiv'
                  : 'Në pritje të pagesës'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Data e pagesës së parë
            </p>
            <p className="mt-1 font-semibold">{formattedTrialEnd}</p>
          </div>
        </div>
        <div className="border-t border-line bg-sand p-5 text-sm leading-6 text-slate-600">
          <b className="text-ink">E rëndësishme:</b> nuk bëhet pagesë sot. Para përfundimit të
          periudhës falas, biznesi do të njoftohet për pagesën prej 30 € në muaj. Integrimi i
          pagesës online aktivizohet vetëm pasi të lidhet një ofrues pagesash në konfigurimin e
          platformës.
        </div>
      </section>
    </>
  );
}
function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
}) {
  return (
    <article className="surface p-5">
      <span className="grid size-9 place-items-center rounded-xl bg-green-50 text-forest">
        <Icon size={18} />
      </span>
      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </article>
  );
}
