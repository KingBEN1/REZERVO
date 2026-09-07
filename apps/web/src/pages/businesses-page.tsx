import { Heart, MapPin, Search, SlidersHorizontal, Star, UsersRound } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { SiteHeader } from '../components/site-header';
import { EmptyState } from '../components/ui/empty-state';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { localIsoDate, money } from '../lib/utils';

type Business = {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo: string | null;
  coverImage: string | null;
  category: { name: string; slug: string } | null;
  services: Array<{ price: string }>;
  rating: number | null;
  availableUnits?: number;
};
type Category = { id: string; name: string; slug: string };
type Me = { user: { id: string } };

export function BusinessesPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const hotelSearch = params.get('category') === 'hotels';
  const query = useQuery({
    queryKey: ['businesses', params.toString()],
    queryFn: () => api<{ businesses: Business[] }>(`/public/businesses?${params.toString()}`),
  });
  const categories = useQuery({
    queryKey: ['business-categories'],
    queryFn: () => api<{ categories: Category[] }>('/public/categories'),
  });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me'), retry: false });
  const favorite = useMutation({
    mutationFn: (businessId: string) =>
      api(`/customer/favorites/${businessId}`, { method: 'POST' }),
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    update('q', search);
  };
  return (
    <>
      <SiteHeader />
      <main className="page-shell py-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="eyebrow">Gjej dhe rezervo</p>
          <h1 className="display mt-2 text-4xl font-bold">Bizneset pranë jush</h1>
          <p className="mt-3 text-slate-600">
            Krahaso sipas qytetit, çmimit dhe vlerësimeve. Për hotele, kontrollo datat dhe dhomat e
            lira para rezervimit.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="surface mt-8 grid gap-3 p-3 lg:grid-cols-[1fr_170px_200px_auto]"
        >
          <label className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              className="input pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="p.sh. hotel, taxi, dentist, masazh..."
            />
          </label>
          <select
            className="input"
            value={params.get('city') ?? ''}
            onChange={(event) => update('city', event.target.value)}
          >
            <option value="">Të gjitha qytetet</option>
            {['Prishtinë', 'Ferizaj', 'Prizren', 'Gjilan', 'Pejë', 'Gjakovë', 'Mitrovicë'].map(
              (city) => (
                <option key={city}>{city}</option>
              ),
            )}
          </select>
          <select
            className="input"
            value={params.get('category') ?? ''}
            onChange={(event) => update('category', event.target.value)}
          >
            <option value="">Të gjitha kategoritë</option>
            {categories.data?.categories.map((category) => (
              <option value={category.slug} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit">Kërko</Button>
        </form>
        <section className="surface mt-4 p-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-forest" />
            <b className="text-sm">Filtro rezultatet</b>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Çmimi min.</span>
              <input
                className="input"
                type="number"
                min="0"
                value={params.get('minPrice') ?? ''}
                onChange={(event) => update('minPrice', event.target.value)}
                placeholder="0 €"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Çmimi max.</span>
              <input
                className="input"
                type="number"
                min="0"
                value={params.get('maxPrice') ?? ''}
                onChange={(event) => update('maxPrice', event.target.value)}
                placeholder="200 €"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Vlerësimi</span>
              <select
                className="input"
                value={params.get('minRating') ?? ''}
                onChange={(event) => update('minRating', event.target.value)}
              >
                <option value="">Çdo vlerësim</option>
                <option value="4">4+ yje</option>
                <option value="4.5">4.5+ yje</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-slate-500">Rendit</span>
              <select
                className="input"
                value={params.get('sort') ?? 'recommended'}
                onChange={(event) => update('sort', event.target.value)}
              >
                <option value="recommended">Sugjeruar</option>
                <option value="rating">Vlerësimi më i lartë</option>
                <option value="price-low">Çmimi më i ulët</option>
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              className="self-end"
              onClick={() => {
                setSearch('');
                setParams({});
              }}
            >
              Pastro filtrat
            </Button>
          </div>
          {hotelSearch && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-sm font-bold text-forest">Kontrollo dhomat e lira</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Hyrja</span>
                  <input
                    className="input"
                    type="date"
                    min={localIsoDate(1)}
                    value={params.get('checkIn') ?? ''}
                    onChange={(event) => update('checkIn', event.target.value)}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Dalja</span>
                  <input
                    className="input"
                    type="date"
                    min={params.get('checkIn') ?? localIsoDate(1)}
                    value={params.get('checkOut') ?? ''}
                    onChange={(event) => update('checkOut', event.target.value)}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-slate-500">Mysafirë</span>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="20"
                    value={params.get('guests') ?? '1'}
                    onChange={(event) => update('guests', event.target.value)}
                  />
                </label>
              </div>
            </div>
          )}
        </section>
        {query.isLoading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-80 animate-pulse rounded-3xl bg-white" />
            ))}
          </div>
        )}
        {query.isError && (
          <EmptyState
            title="Nuk arritëm t’i ngarkojmë bizneset"
            detail="Kontrolloni lidhjen dhe provoni përsëri."
            action={<Button onClick={() => query.refetch()}>Provo përsëri</Button>}
          />
        )}
        {query.data &&
          (query.data.businesses.length ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {query.data.businesses.map((business) => (
                <article
                  key={business.id}
                  className="group surface overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <Link to={`/book/${business.slug}`}>
                    <div className="h-40 bg-green-100">
                      {business.coverImage ? (
                        <img
                          src={business.coverImage}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-forest">rezervo</div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-moss">
                            {business.category?.name ?? 'Shërbime'}
                          </p>
                          <h2 className="mt-1 font-bold">{business.name}</h2>
                        </div>
                        {business.rating && (
                          <span className="flex items-center gap-1 text-xs font-semibold">
                            <Star size={14} className="fill-amber-400 text-amber-400" />
                            {business.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                        <MapPin size={14} />
                        {business.city}
                      </p>
                      {business.availableUnits !== undefined && (
                        <p className="mt-3 flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-800">
                          <UsersRound size={14} />
                          {business.availableUnits <= 3
                            ? `Vetëm ${business.availableUnits} dhoma të lira`
                            : `${business.availableUnits} dhoma të lira`}
                        </p>
                      )}
                      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
                        <span className="text-slate-500">
                          Nga {business.services[0] ? money(business.services[0].price) : '—'}
                        </span>
                        <span className="font-semibold text-forest">Rezervo →</span>
                      </div>
                    </div>
                  </Link>
                  {me.data && (
                    <button
                      onClick={() => favorite.mutate(business.id)}
                      disabled={favorite.isPending}
                      className="flex w-full items-center gap-2 border-t border-line px-5 py-3 text-sm font-semibold text-forest"
                    >
                      <Heart size={16} /> Ruaj te të preferuarat
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="Nuk gjetëm biznese"
                detail="Provoni një kategori, shërbim ose qytet tjetër."
              />
            </div>
          ))}
      </main>
    </>
  );
}
