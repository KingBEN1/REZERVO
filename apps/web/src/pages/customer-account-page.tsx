import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, Heart, MapPin, Sparkles } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { api } from '../lib/api';
import { dateTime, money } from '../lib/utils';

type Business = {
  id: string;
  name: string;
  slug: string;
  city: string;
  coverImage: string | null;
  category?: { name: string; slug: string } | null;
  services?: Array<{ price: string }>;
  rating?: number | null;
};
type Booking = {
  id: string;
  manageToken: string;
  startAt: string;
  status: string;
  kind: string;
  price: string;
  currency: string;
  business: Business;
  service: { name: string };
  staff: { name: string };
};
type Account = {
  user: { firstName: string; lastName: string; email: string };
  upcoming: Booking[];
  past: Booking[];
  favorites: Business[];
};

function BusinessCard({
  business,
  favorite,
  onFavorite,
}: {
  business: Business;
  favorite?: boolean;
  onFavorite?: () => void;
}) {
  return (
    <article className="surface overflow-hidden">
      <Link to={`/book/${business.slug}`} className="group block">
        <div className="h-28 bg-green-100">
          {business.coverImage && (
            <img
              src={business.coverImage}
              alt=""
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          )}
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold text-moss">
            {business.category?.name ?? 'Rezervime'}
          </p>
          <h3 className="mt-1 font-bold">{business.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={13} />
            {business.city}
          </p>
          {business.rating && (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              ★ {business.rating.toFixed(1)}
            </p>
          )}
        </div>
      </Link>
      {onFavorite && (
        <div className="border-t border-line px-4 py-3">
          <button
            onClick={onFavorite}
            className="flex items-center gap-2 text-sm font-semibold text-forest"
          >
            <Heart size={16} className={favorite ? 'fill-forest' : ''} />
            {favorite ? 'Hiq nga të preferuarat' : 'Ruaj'}
          </button>
        </div>
      )}
    </article>
  );
}

export function CustomerAccountPage() {
  const client = useQueryClient();
  const account = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: () => api<Account>('/customer/dashboard'),
    retry: false,
  });
  const recommendations = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => api<{ recommendations: Business[] }>('/customer/recommendations'),
    enabled: Boolean(account.data),
  });
  const favorite = useMutation({
    mutationFn: ({ businessId, active }: { businessId: string; active: boolean }) =>
      api(`/customer/favorites/${businessId}`, { method: active ? 'DELETE' : 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['customer-dashboard'] }),
  });
  if (account.isLoading)
    return (
      <main className="grid min-h-screen place-items-center bg-sand">
        <span className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
      </main>
    );
  if (account.isError || !account.data) return <Navigate to="/login" replace />;
  const savedIds = new Set(account.data.favorites.map((item) => item.id));
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-9 sm:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Llogaria e klientit</p>
            <h1 className="display mt-2 text-3xl font-bold">
              Përshëndetje, {account.data.user.firstName}
            </h1>
            <p className="mt-2 text-slate-600">
              Rezervimet, bizneset e ruajtura dhe sugjerimet tuaja në një vend.
            </p>
          </div>
          <Link to="/businesses">
            <Button>
              Gjej diçka për të rezervuar <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Rezervimet e ardhshme</h2>
            <CalendarDays className="text-forest" size={21} />
          </div>
          {account.data.upcoming.length ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {account.data.upcoming.map((booking) => (
                <Link
                  key={booking.id}
                  to={`/manage/${booking.manageToken}`}
                  className="surface flex gap-4 p-4 transition hover:border-forest"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-green-50 text-forest">
                    <CalendarDays size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold">{booking.business.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {booking.service.name} · {booking.staff.name}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-forest">
                      {booking.kind === 'ACCOMMODATION'
                        ? 'Qëndrim hoteli'
                        : dateTime(booking.startAt)}
                    </p>
                  </div>
                  <span className="ml-auto h-fit rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-forest">
                    {booking.status === 'PENDING' ? 'Në pritje' : 'Konfirmuar'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Nuk keni rezervime të ardhshme"
                detail="Gjeni një hotel, shërbim ose transport dhe rezervoni online."
                action={
                  <Link to="/businesses">
                    <Button>Eksploro bizneset</Button>
                  </Link>
                }
              />
            </div>
          )}
        </section>
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Heart className="text-forest" size={21} />
            <h2 className="text-lg font-bold">Të preferuarat</h2>
          </div>
          {account.data.favorites.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {account.data.favorites.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  favorite
                  onFavorite={() => favorite.mutate({ businessId: business.id, active: true })}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Ruani bizneset që dëshironi t’i gjeni përsëri shpejt.
            </p>
          )}
        </section>
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Sparkles className="text-forest" size={21} />
            <h2 className="text-lg font-bold">Sugjeruar për ju</h2>
          </div>
          {recommendations.data?.recommendations.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.data.recommendations.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  favorite={savedIds.has(business.id)}
                  onFavorite={() =>
                    favorite.mutate({ businessId: business.id, active: savedIds.has(business.id) })
                  }
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              Pasi të ruani ose rezervoni disa biznese, këtu do të shfaqen sugjerime të përshtatura.
            </p>
          )}
        </section>
        {account.data.past.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">Historia e rezervimeve</h2>
            <div className="surface mt-4 divide-y divide-line">
              {account.data.past.slice(0, 5).map((booking) => (
                <Link
                  key={booking.id}
                  to={`/manage/${booking.manageToken}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-sand"
                >
                  <span>
                    <b className="block text-sm">{booking.business.name}</b>
                    <small className="text-slate-500">
                      {booking.service.name} · {dateTime(booking.startAt)}
                    </small>
                  </span>
                  <span className="text-sm font-semibold">
                    {money(booking.price, booking.currency)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
