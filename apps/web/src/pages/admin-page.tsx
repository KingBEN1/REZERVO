import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CalendarClock,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Users,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { EmptyState } from '../components/ui/empty-state';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { money } from '../lib/utils';
import { useTenant } from './dashboard-page';

type Metrics = {
  businesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  users: number;
  bookings: number;
  pendingBookings: number;
  reviews: number;
  mrr: number;
};
type Business = {
  id: string;
  name: string;
  city: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  createdAt: string;
  category: { name: string } | null;
  _count: { bookings: number; staff: number };
  subscription: { status: string; plan: { name: string; monthlyPrice: string } } | null;
  verification: {
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    legalName: string;
    registrationNumber: string;
    contactName: string;
    contactPhone: string;
    reviewNote: string | null;
  } | null;
};

export function AdminPage() {
  const me = useTenant();
  const queryClient = useQueryClient();
  const allowed =
    me.data?.user.platformRole === 'SUPER_ADMIN' || me.data?.user.platformRole === 'SUPPORT_ADMIN';
  const query = useQuery({
    queryKey: ['admin-metrics'],
    enabled: allowed,
    queryFn: () => api<Metrics>('/admin/metrics'),
  });
  const businesses = useQuery({
    queryKey: ['admin-businesses'],
    enabled: allowed,
    queryFn: () => api<{ businesses: Business[] }>('/admin/businesses'),
  });
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Business['status'] }) =>
      api(`/admin/businesses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
  });
  const reviewVerification = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api(`/admin/businesses/${id}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
  });
  if (me.isLoading)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </div>
    );
  if (!me.data?.user.platformRole) return <Navigate to="/dashboard" replace />;
  if (query.isError || businesses.isError)
    return (
      <main className="p-8">
        <EmptyState
          title="Nuk mundëm t’i ngarkojmë të dhënat"
          detail="Kontrolloni qasjen tuaj dhe provoni përsëri."
          action={
            <Button
              onClick={() => {
                query.refetch();
                businesses.refetch();
              }}
            >
              Provo përsëri
            </Button>
          }
        />
      </main>
    );
  const metrics = query.data;
  if (!metrics) return null;
  return (
    <main className="min-h-screen bg-sand p-5 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Platforma</p>
        <h1 className="display mt-1 text-3xl font-bold">Administrimi</h1>
        <p className="mt-2 text-slate-600">
          Mbikëqyrni bizneset, rezervimet dhe gjendjen e platformës.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Building2} label="Biznese gjithsej" value={metrics.businesses} />
          <Metric icon={Users} label="Përdorues" value={metrics.users} />
          <Metric icon={CalendarDays} label="Rezervime" value={metrics.bookings} />
          <Metric icon={CreditCard} label="MRR" value={money(metrics.mrr)} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MiniMetric
            icon={Building2}
            label="Në pritje për kontroll"
            value={metrics.pendingBusinesses}
          />
          <MiniMetric
            icon={CalendarClock}
            label="Rezervime në pritje"
            value={metrics.pendingBookings}
          />
          <MiniMetric icon={MessageSquare} label="Vlerësime" value={metrics.reviews} />
        </div>
        <section className="surface mt-7 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold">Bizneset e regjistruara</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Aktivizoni ose pezulloni llogaritë sipas kontrollit tuaj.
              </p>
            </div>
            {changeStatus.error && <p className="text-sm text-red-700">Statusi nuk u ndryshua.</p>}
          </div>
          {businesses.isLoading ? (
            <div className="h-48 animate-pulse bg-white" />
          ) : businesses.data?.businesses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-sand text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Biznesi</th>
                    <th className="px-5 py-3">Kategoria</th>
                    <th className="px-5 py-3">Aktiviteti</th>
                    <th className="px-5 py-3">Abonimi</th>
                    <th className="px-5 py-3">Verifikimi</th>
                    <th className="px-5 py-3">Statusi</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.data.businesses.map((business) => (
                    <tr className="border-t border-line" key={business.id}>
                      <td className="px-5 py-4">
                        <b className="block">{business.name}</b>
                        <span className="text-xs text-slate-500">{business.city}</span>
                      </td>
                      <td className="px-5 py-4">{business.category?.name ?? 'Pa kategori'}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {business._count.bookings} rezervime · {business._count.staff} burime
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {business.subscription?.plan.name ?? 'Pa plan'}
                      </td>
                      <td className="px-5 py-4">
                        {business.verification?.status === 'SUBMITTED' ? (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600">
                              {business.verification.legalName} ·{' '}
                              {business.verification.registrationNumber}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={reviewVerification.isPending}
                                onClick={() =>
                                  reviewVerification.mutate({ id: business.id, status: 'APPROVED' })
                                }
                              >
                                Mirato
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={reviewVerification.isPending}
                                onClick={() =>
                                  reviewVerification.mutate({ id: business.id, status: 'REJECTED' })
                                }
                              >
                                Refuzo
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${business.verification?.status === 'APPROVED' ? 'bg-green-50 text-forest' : 'bg-sand text-slate-500'}`}
                          >
                            {business.verification?.status === 'APPROVED'
                              ? 'Verifikuar'
                              : business.verification?.status === 'REJECTED'
                                ? 'Kërkon korrigjim'
                                : 'Pa kërkesë'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          aria-label={`Statusi për ${business.name}`}
                          className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-semibold"
                          disabled={changeStatus.isPending}
                          value={business.status}
                          onChange={(event) =>
                            changeStatus.mutate({
                              id: business.id,
                              status: event.target.value as Business['status'],
                            })
                          }
                        >
                          <option value="PENDING">Në pritje</option>
                          <option value="ACTIVE">Aktiv</option>
                          <option value="SUSPENDED">Pezulluar</option>
                          <option value="INACTIVE">Joaktiv</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState title="Nuk ka biznese" detail="Bizneset e reja do të shfaqen këtu." />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
}) {
  return (
    <article className="surface p-5">
      <Icon className="text-forest" size={20} />
      <p className="mt-5 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </article>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-line bg-white p-4">
      <Icon className="text-forest" size={18} />
      <p className="mt-3 text-xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </article>
  );
}
