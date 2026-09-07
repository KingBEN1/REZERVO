import {
  ArrowRight,
  CalendarCheck2,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
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
        <section className="overflow-hidden bg-[#e6f3e7] pb-16 pt-14 sm:pb-24 sm:pt-20">
          <div className="page-shell">
            <div className="mx-auto max-w-3xl text-center">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="eyebrow"
              >
                Rezervo shpejt. Shko pa stres.
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="display mt-4 text-4xl font-bold leading-[1.04] tracking-tight text-ink sm:text-6xl"
              >
                Gjej, krahaso dhe <span className="text-forest">rezervo</span> online.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
              >
                Hotele, taksi, bukuri, klinika, restorante dhe shërbime pranë jush — me
                disponueshmëri, çmime dhe konfirmim të qartë.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
              >
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
              </motion.div>
              <p className="mt-4 text-xs text-slate-500">
                Rezervim i sigurt · Menaxho terminin nga llogaria jote
              </p>
            </div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
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
                className="surface flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:border-forest"
              >
                <span className="font-bold">{category}</span>
                <ArrowRight className="text-forest" size={18} />
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-ink py-16 text-white sm:py-20">
          <div className="page-shell grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
              <p className="eyebrow text-green-300">E thjeshtë për klientin</p>
              <h2 className="display mt-3 text-3xl font-bold sm:text-4xl">
                Kërko, zgjidh dhe menaxho çdo rezervim nga një llogari e vetme.
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
            <div className="rounded-3xl bg-white p-6 text-ink">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Hotel në Prishtinë</p>
                  <b className="text-lg">Dhomë dyshe</b>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                  ★ 4.8
                </span>
              </div>
              <p className="mt-5 rounded-xl bg-sand p-3 text-sm">
                Hyrje: 14 shtator · Dalje: 16 shtator
              </p>
              <p className="mt-3 flex gap-2 text-sm text-forest">
                <Sparkles size={17} /> Vetëm 2 dhoma të lira
              </p>
              <Button className="mt-5 w-full">Shiko disponueshmërinë</Button>
            </div>
          </div>
        </section>
        <section className="page-shell py-16 sm:py-24">
          <div className="surface grid gap-6 overflow-hidden bg-[#fff7e8] p-7 sm:grid-cols-[1fr_auto] sm:p-10">
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
    <article className="rounded-2xl border border-white/60 bg-white/80 p-5 text-left shadow-sm">
      <Icon className="text-forest" size={22} />
      <h2 className="mt-4 font-bold">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  );
}
