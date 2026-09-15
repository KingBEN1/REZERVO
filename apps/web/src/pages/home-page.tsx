import {
  ArrowRight,
  CalendarCheck2,
  Heart,
  MapPin,
  ShieldCheck,
  Store,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';

const categories = [
  'Hotele',
  'Taksi & transfer',
  'Bukuri',
  'Shëndetësi',
  'Restorante',
  'Fitness',
  'Evente',
  'Shërbime auto',
];

export function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="tech-grid relative isolate overflow-hidden bg-[#07111f] pb-16 pt-14 text-white sm:pb-24 sm:pt-20">
          <div aria-hidden className="absolute -left-32 -top-28 -z-10 size-[30rem] rounded-full bg-indigo-600/30 blur-3xl" />
          <div aria-hidden className="absolute -right-24 bottom-0 -z-10 size-[32rem] rounded-full bg-cyan-400/20 blur-3xl" />
          <div aria-hidden className="absolute left-1/2 top-1/3 -z-10 h-48 w-48 -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="page-shell relative">
            <div className="mx-auto max-w-3xl text-center">
              <p className="hero-reveal mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-cyan-200 shadow-xl backdrop-blur-xl">
                Rezervo shpejt. Shko pa stres.
              </p>
              <h1 className="hero-reveal hero-delay-1 display mx-auto mt-5 max-w-4xl text-[2.55rem] font-bold leading-[1.04] tracking-[-.025em] text-white sm:text-6xl lg:text-7xl">
                Gjej, krahaso dhe <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">rezervo</span> online.
              </h1>
              <p className="hero-reveal hero-delay-2 mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Hotele, taksi, bukuri, klinika, restorante dhe shërbime pranë jush — me
                disponueshmëri, çmime dhe konfirmim të qartë.
              </p>
              <div className="hero-reveal hero-delay-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/businesses">
                  <Button size="lg" className="w-full sm:w-auto">
                    Gjej një rezervim <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Krijo llogari klienti
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">
                Rezervim i sigurt · Menaxho terminin nga llogaria jote
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Preview
                icon={MapPin}
                title="Gjej pranë teje"
                text="Kërko sipas qytetit, kategorisë, çmimit dhe vlerësimit."
              />
              <Preview
                icon={CalendarCheck2}
                title="Rezervo në kohë reale"
                text="Zgjidh datën, orën ose qëndrimin dhe merr konfirmim."
              />
              <Preview
                icon={Heart}
                title="Ruaj të preferuarat"
                text="Kthehu te bizneset që të pëlqejnë nga llogaria jote."
              />
            </div>
          </div>
        </section>
        <section className="page-shell py-16 sm:py-24">
          <p className="eyebrow">Eksploro sipas nevojës</p>
          <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
            Çfarë dëshiron të rezervosh?
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category}
                to={`/businesses?q=${encodeURIComponent(category)}`}
                className="surface lift-3d group flex items-center justify-between p-5 hover:border-indigo-200"
              >
                <span className="font-bold">{category}</span>
                <ArrowRight className="text-forest transition group-hover:translate-x-1" size={18} />
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-ink py-16 text-white sm:py-20">
          <div className="page-shell">
            <div className="mx-auto max-w-4xl text-center">
              <p className="eyebrow text-green-300">E thjeshtë për klientin</p>
              <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
                Kërko, zgjidh dhe menaxho çdo rezervim nga një llogari e vetme.
              </h2>
              <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
                {[
                  'Disponueshmëri në kohë reale',
                  'Vlerësime nga klientë të verifikuar',
                  'Lidhje e sigurt për anulim ose ndryshim',
                  'Preferenca dhe sugjerime personale',
                ].map((text) => (
                  <p key={text} className="flex gap-3 text-sm text-green-50">
                    <ShieldCheck className="shrink-0 text-green-300" size={18} />
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="page-shell py-16 sm:py-24">
          <div className="surface lift-3d relative grid gap-6 overflow-hidden bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_58%,#ecfeff_100%)] p-7 sm:grid-cols-[1fr_auto] sm:p-10">
            <div>
              <p className="eyebrow">Ke biznes?</p>
              <h2 className="display mt-2 text-3xl font-bold">Hape faqen tënde të rezervimeve.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Shtoni ofertat, dhomat, automjetet ose ekipin tuaj. Merrni 30 ditë falas për ta
                provuar platformën.
              </p>
              <Link to="/for-business" className="mt-6 inline-block">
                <Button>
                  Shiko zgjidhjen për biznese <Store size={16} />
                </Button>
              </Link>
            </div>
            <div className="flex items-end gap-3 text-forest">
              <Store size={38} />
              <Star size={32} />
              <CalendarCheck2 size={42} />
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-line py-8">
        <div className="page-shell flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Rezervo</span>
          <div className="flex gap-4">
            <Link to="/terms">Kushtet</Link>
            <Link to="/privacy">Privatësia</Link>
            <Link to="/contact">Kontakt</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function Preview({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof MapPin;
  title: string;
  text: string;
}) {
  return (
    <article className="glass-panel lift-3d rounded-3xl p-6 text-left">
      <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-indigo-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,.25)]">
        <Icon className="text-cyan-200" size={22} />
      </span>
      <h2 className="mt-4 font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
    </article>
  );
}
