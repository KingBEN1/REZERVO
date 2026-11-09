import { Heart, MapPin, Search, SlidersHorizontal, Star, UsersRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  featured?: boolean;
  availableUnits?: number;
};
type Category = { id: string; name: string; slug: string };
type Me = { user: { id: string } };

const categoryImages: Record<string, string> = {
  hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
  barbers: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85',
  restaurants: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85',
  'taxi-transport': 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=85',
  'beauty-salons': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85',
  'spa-wellness': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=85',
  'health-clinics': 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=1200&q=85',
  dentists: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=85',
  physiotherapy: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
  photography: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1200&q=85',
  'events-venues': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=85',
  education: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=85',
  'professional-services': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85',
  'home-services': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
  'pet-care': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=1200&q=85',
  'legal-notary': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=85',
  rentals: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=85',
  'tourism-activities': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=85',
  coworking: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=85',
  'electronics-repair': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85',
  'child-care': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=85',
  'car-service': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1200&q=85',
  other: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=85',
};

function categoryImage(slug: string) {
  return categoryImages[slug] ?? categoryImages.other;
}

function startingPrice(services: Business['services']) {
  const price = Number(services[0]?.price ?? 0);
  return Number.isFinite(price) && price > 0 ? `Nga ${money(price)}` : 'Pyet për çmim';
}

export function BusinessesPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const selectedCategorySlug = params.get('category') ?? '';
  const hotelSearch = selectedCategorySlug === 'hotels';
  const query = useQuery({
    queryKey: ['businesses', params.toString()],
    queryFn: () => api<{ businesses: Business[] }>(`/public/businesses?${params.toString()}`),
    enabled: Boolean(selectedCategorySlug),
  });
  const categories = useQuery({
    queryKey: ['business-categories'],
    queryFn: () => api<{ categories: Category[] }>('/public/categories'),
  });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<Me>('/auth/me'), retry: false });
  const favorite = useMutation({
    mutationFn: (businessId: string) =>
      api(`/customer/favorites/${businessId}`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['customer-dashboard'] }),
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next);
  };
  const selectedCategory = categories.data?.categories.find(
    (category) => category.slug === selectedCategorySlug,
  );
  const directoryTitle = selectedCategory
    ? selectedCategory.name
    : 'Bizneset pranë jush';
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    update('q', search);
  };
  return (
    <>
      <SiteHeader />
      <main className="discovery-page page-shell py-7 sm:py-10">
        <div className="discovery-hero">
          <div
            aria-hidden
            className="absolute -right-20 -top-24 size-72 rounded-full bg-indigo-500/25 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 left-1/4 size-64 rounded-full bg-cyan-400/20 blur-3xl"
          />
          <p className="eyebrow relative text-cyan-300">Gjej dhe rezervo</p>
          <h1 className="display relative mt-2 text-4xl font-bold sm:text-5xl">
            {directoryTitle}
          </h1>
          <p className="relative mt-3 max-w-2xl text-slate-300">
            {selectedCategory
              ? `Po shfaqim vetëm bizneset e kategorisë “${selectedCategory.name}”.`
              : 'Krahaso sipas qytetit, çmimit dhe vlerësimeve. Për hotele, kontrollo datat dhe dhomat e lira para rezervimit.'}
          </p>
        </div>
        {!selectedCategorySlug && (
          <section className="mt-10">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Eksploro sipas kategorisë</p>
                <h2 className="display mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Zgjidh çfarë dëshiron të rezervosh</h2>
              </div>
              <p className="text-sm text-slate-500">Kliko një kategori për të parë vetëm ato biznese.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.data?.categories.map((category, index) => (
                <Link
                  key={category.id}
                  to={`/businesses?category=${encodeURIComponent(category.slug)}`}
                  className={`group relative isolate min-h-44 overflow-hidden rounded-[1.45rem] border border-white/70 bg-slate-900 shadow-[0_16px_32px_rgba(15,23,42,.13)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_25px_45px_rgba(15,23,42,.22)] ${index < 2 ? 'sm:min-h-56' : ''}`}
                >
                  <img src={categoryImage(category.slug)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5" />
                  <div className="relative flex min-h-44 flex-col justify-end p-5 text-white sm:min-h-48">
                    <span className="mb-3 w-fit rounded-full border border-white/20 bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.16em] backdrop-blur">Rezervo</span>
                    <h3 className="display text-lg font-bold leading-tight">{category.name}</h3>
                    <span className="mt-2 text-sm font-bold text-cyan-200 transition group-hover:translate-x-1">Shiko bizneset →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {selectedCategory && (
          <section className="mt-8 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-[0_15px_35px_rgba(15,23,42,.08)] sm:flex">
            <img src={categoryImage(selectedCategory.slug)} alt="" className="h-44 w-full object-cover sm:h-auto sm:w-72" />
            <div className="flex flex-1 flex-col justify-center p-6">
              <p className="eyebrow">Kategori e zgjedhur</p>
              <h2 className="display mt-1 text-2xl font-bold text-slate-900">{selectedCategory.name}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Rezultatet më poshtë përmbajnë vetëm bizneset e kësaj kategorie.</p>
              <Link to="/businesses" className="mt-4 w-fit text-sm font-bold text-indigo-700 hover:text-indigo-900">← Shiko të gjitha kategoritë</Link>
            </div>
          </section>
        )}
        {selectedCategorySlug && (
          <>
        <form onSubmit={submit} className="discovery-search relative mt-7 grid gap-3 p-3 lg:grid-cols-[1fr_170px_200px_auto]">
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
            value={selectedCategorySlug}
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
        <section className="discovery-filters mt-4 p-4">
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
                  className="discovery-card group overflow-hidden"
                >
                  <Link to={`/${business.slug}`}>
                    <div className="relative h-40 bg-green-100">
                      {business.featured && (
                        <span className="absolute ml-3 mt-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950 shadow-lg">
                          ★ Biznes i promovuar
                        </span>
                      )}
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
                        <span className="text-slate-500">{startingPrice(business.services)}</span>
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
          </>
        )}
      </main>
    </>
  );
}
