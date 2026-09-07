import { ArrowRight, BarChart3, CalendarCheck2, Store, UsersRound } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

type Me = { user: { memberships: Array<{ business: { id: string } }> } };

export function BusinessStartPage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/auth/me'),
    retry: false,
    staleTime: 30_000,
  });
  const hasBusiness = Boolean(me.data?.user.memberships.length);
  const createLink = me.data
    ? hasBusiness
      ? '/dashboard'
      : '/onboarding'
    : '/register?intent=business';
  return (
    <>
      <SiteHeader />
      <main className="bg-sand">
        <section className="page-shell grid gap-10 py-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-24">
          <div>
            <p className="eyebrow">Për pronarët e bizneseve</p>
            <h1 className="display mt-3 text-4xl font-bold leading-tight sm:text-6xl">
              Merrni rezervime online, pa telefonata dhe pa kaos.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Krijoni faqen tuaj për hotel, sallon, klinikë, taksi, restorant ose çdo shërbim që
              kërkon rezervim. Muaji i parë është falas.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={createLink}>
                <Button size="lg">
                  {hasBusiness ? 'Hap panelin e biznesit' : 'Krijo biznesin falas'}{' '}
                  <ArrowRight size={16} />
                </Button>
              </Link>
              {!me.data && (
                <Link to="/login?intent=business">
                  <Button size="lg" variant="secondary">
                    Hyr në panelin e biznesit
                  </Button>
                </Link>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-500">
              30 ditë falas · pastaj 30 € / muaj · pa kartelë sot
            </p>
          </div>
          <div className="surface grid gap-4 p-6 sm:grid-cols-2">
            {[
              {
                icon: CalendarCheck2,
                title: 'Rezervime 24/7',
                text: 'Faqe publike dhe disponueshmëri në kohë reale.',
              },
              {
                icon: UsersRound,
                title: 'Ekip dhe burime',
                text: 'Staf, dhoma, automjete, tavolina ose hapësira.',
              },
              {
                icon: BarChart3,
                title: 'Panel i qartë',
                text: 'Rezervime, klientë dhe veprimet kryesore në një vend.',
              },
              {
                icon: Store,
                title: 'Shumë kategori',
                text: 'Për bizneset e Kosovës, pa kufizim lloji.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl bg-sand p-4">
                <Icon className="text-forest" size={22} />
                <h2 className="mt-4 font-bold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
