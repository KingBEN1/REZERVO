import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgePercent, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api } from '../lib/api';
import { money } from '../lib/utils';
import { useTenant } from './dashboard-page';

type Coupon = {
  id: string;
  code: string;
  percentOff: number | null;
  amountOff: string | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

const dateLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('sq-XK', { dateStyle: 'medium' }).format(new Date(value))
    : 'Pa afat';

export function PromotionsPage() {
  const { membership } = useTenant();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'amount',
    value: '',
    startsAt: '',
    endsAt: '',
  });
  const query = useQuery({
    queryKey: ['coupons', membership?.business.id],
    enabled: Boolean(membership),
    queryFn: () => api<{ coupons: Coupon[] }>('/business/coupons', {}, membership!.business.id),
  });
  const create = useMutation({
    mutationFn: () => {
      const value = Number(form.value);
      return api(
        '/business/coupons',
        {
          method: 'POST',
          body: JSON.stringify({
            code: form.code.trim().toUpperCase(),
            percentOff: form.discountType === 'percent' ? value : undefined,
            amountOff: form.discountType === 'amount' ? value : undefined,
            startsAt: form.startsAt ? `${form.startsAt}T00:00:00.000Z` : undefined,
            endsAt: form.endsAt ? `${form.endsAt}T23:59:59.999Z` : undefined,
          }),
        },
        membership!.business.id,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setForm({ code: '', discountType: 'percent', value: '', startsAt: '', endsAt: '' });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/business/coupons/${id}`, { method: 'DELETE' }, membership!.business.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  });
  const coupons = query.data?.coupons ?? [];
  return (
    <>
      <div>
        <p className="eyebrow">Marketing i thjeshtë</p>
        <h1 className="display mt-1 text-3xl font-bold">Kuponet dhe ofertat</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Krijoni kode promocionale për klientët. Ato aplikohen automatikisht gjatë rezervimit.
        </p>
      </div>
      <section className="surface mt-7 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-green-50 text-forest">
            <BadgePercent size={20} />
          </span>
          <div>
            <h2 className="font-bold">Krijo kupon të ri</h2>
            <p className="text-sm text-slate-500">Shembull: MIRËSEVINI10 ose VJESHTE2026.</p>
          </div>
        </div>
        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <input
            className="input"
            required
            minLength={3}
            maxLength={40}
            placeholder="Kodi i kuponit"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
          />
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <select
              className="input"
              value={form.discountType}
              onChange={(event) =>
                setForm({ ...form, discountType: event.target.value as 'percent' | 'amount' })
              }
            >
              <option value="percent">Përqindje</option>
              <option value="amount">Shumë €</option>
            </select>
            <input
              className="input"
              required
              type="number"
              min="0.01"
              max={form.discountType === 'percent' ? '100' : undefined}
              step="0.01"
              placeholder={form.discountType === 'percent' ? '10' : '5.00'}
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
            />
          </div>
          <label className="text-xs font-medium text-slate-500">
            Fillon (opsionale)
            <input
              className="input mt-1 w-full"
              type="date"
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
            />
          </label>
          <label className="text-xs font-medium text-slate-500">
            Përfundon (opsionale)
            <input
              className="input mt-1 w-full"
              type="date"
              min={form.startsAt || undefined}
              value={form.endsAt}
              onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full" disabled={create.isPending} type="submit">
              {create.isPending ? 'Duke ruajtur...' : 'Ruaj kuponin'}
            </Button>
          </div>
        </form>
        {create.error && (
          <p className="mt-3 text-sm text-red-700">
            {create.error instanceof Error ? create.error.message : 'Kuponi nuk u ruajt.'}
          </p>
        )}
      </section>
      <section className="surface mt-6 overflow-hidden">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-bold">Kuponet aktive</h2>
        </div>
        {query.isLoading ? (
          <div className="h-32 animate-pulse bg-white" />
        ) : coupons.length ? (
          <div className="divide-y divide-line">
            {coupons.map((coupon) => (
              <article className="flex flex-wrap items-center gap-3 p-5 sm:px-6" key={coupon.id}>
                <span className="rounded-lg bg-sand px-3 py-2 font-mono text-sm font-bold tracking-wide text-forest">
                  {coupon.code}
                </span>
                <div className="min-w-36 flex-1">
                  <p className="font-semibold">
                    {coupon.percentOff
                      ? `${coupon.percentOff}% zbritje`
                      : `${money(coupon.amountOff ?? 0)} zbritje`}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {dateLabel(coupon.startsAt)} — {dateLabel(coupon.endsAt)}
                  </p>
                </div>
                <button
                  className="rounded-lg p-2 text-slate-500 hover:bg-sand hover:text-forest"
                  onClick={() => navigator.clipboard?.writeText(coupon.code)}
                  title="Kopjo kodin"
                  type="button"
                >
                  <Copy size={17} />
                </button>
                <button
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(coupon.id)}
                  title="Fshi kuponin"
                  type="button"
                >
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Ende nuk keni kupon"
              detail="Krijoni një kod për oferta sezonale ose klientët që rezervojnë për herë të parë."
            />
          </div>
        )}
      </section>
    </>
  );
}
