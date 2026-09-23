import { ChevronDown, CircleHelp, Mail, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/site-header';
import { Button } from '../components/ui/button';

const sections = [
  {
    title: 'Rezervimet',
    questions: [
      [
        'Si bëj një rezervim?',
        'Hapni faqen e biznesit, zgjidhni shërbimin, personin ose burimin, datën dhe kohën. Plotësoni të dhënat e kontaktit dhe konfirmoni rezervimin.',
      ],
      [
        'A mund ta anuloj ose ndryshoj termin?',
        'Po. Hapni lidhjen “Menaxho termin” në emailin e konfirmimit. Mundësia për ndryshim ose anulim varet nga rregullat e biznesit dhe koha e mbetur deri në termin tuaj.',
      ],
      [
        'Nuk e mora emailin e konfirmimit.',
        'Kontrolloni Spam/Junk dhe verifikoni nëse emaili është shkruar saktë. Nëse ende nuk e gjeni, kërkoni rezervimin nga biznesi ose përdorni Ndihmë pasi të hyni në llogari.',
      ],
      [
        'Pse nuk më vjen kodi me SMS?',
        'Sigurohuni që numri është në format ndërkombëtar, p.sh. +383 ose +355. Nëse SMS-i vonohet, përdorni verifikimin me email ose provoni përsëri pas pak minutash.',
      ],
    ],
  },
  {
    title: 'Llogaria dhe siguria',
    questions: [
      [
        'Si e verifikoj emailin?',
        'Pas regjistrimit dërgojmë një kod verifikimi në email. Shkruajeni kodin në faqen e verifikimit para se të përdorni plotësisht llogarinë.',
      ],
      [
        'Nuk mund të hyj me Google.',
        'Kontrolloni që po përdorni emailin e saktë. Nëse faqja vetëm rifreskohet, provoni një dritare private ose fshini cookies për rezervoks.com dhe provoni përsëri.',
      ],
      [
        'Si e ndryshoj fjalëkalimin?',
        'Te faqja e hyrjes zgjidhni “Harrova fjalëkalimin”. Do të merrni një email me lidhje të sigurt për ta vendosur fjalëkalimin e ri.',
      ],
      [
        'A ruhen të sigurta të dhënat e mia?',
        'Përdorim lidhje të enkriptuar dhe kërkojmë vetëm të dhënat e nevojshme për rezervim. Mos ndani kurrë kodet e verifikimit me persona të tjerë.',
      ],
    ],
  },
  {
    title: 'Për bizneset',
    questions: [
      [
        'Si e publikoj biznesin tim?',
        'Krijoni llogari biznesi, zgjidhni kategorinë, plotësoni profilin, shtoni shërbimet, ekipin ose burimet dhe orarin e punës. Pastaj dërgoni biznesin për verifikim.',
      ],
      [
        'Pse nuk shfaqet biznesi në kërkim?',
        'Biznesi duhet të jetë i plotësuar dhe i verifikuar para publikimit. Kontrolloni profilin, shërbimet, orarin dhe statusin e verifikimit në panel.',
      ],
      [
        'Çfarë çmimi duhet të vendos?',
        'Vendosni çmimin real për secilin shërbim ose paketë. Nëse çmimi caktohet pas konsultës, lëreni pa çmim që klientët të shohin “Pyet për çmim”, jo €0.00.',
      ],
      [
        'Si funksionon promovimi?',
        'Faqja “Promovo biznesin” shpjegon vendosjet premium. Pagesa reale dhe aktivizimi automatik do të hapen vetëm pasi oferta dhe kushtet të jenë publikuar qartë.',
      ],
    ],
  },
  {
    title: 'Pagesat dhe çmimet',
    questions: [
      [
        'A paguaj online për çdo rezervim?',
        'Jo domosdoshmërisht. Secili biznes vendos nëse pranon pagesë online, depozitë, pagesë në vend ose vetëm kërkesë për rezervim.',
      ],
      [
        'Çfarë do të thotë “Pyet për çmim”?',
        'Biznesi nuk ka publikuar ende një çmim fiks. Hapni faqen e tij ose kontaktoni biznesin për ofertë të saktë para rezervimit.',
      ],
      [
        'Kur më kthehen paratë?',
        'Rimbursimi varet nga politika e biznesit dhe mënyra e pagesës. Për një pagesë të kryer, fillimisht kontaktoni biznesin përkatës me numrin e rezervimit.',
      ],
    ],
  },
];

export function FaqPage() {
  const [search, setSearch] = useState('');
  const normalized = search.trim().toLocaleLowerCase();
  const results = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          questions: section.questions.filter(
            ([question, answer]) =>
              !normalized || `${question} ${answer}`.toLocaleLowerCase().includes(normalized),
          ),
        }))
        .filter((section) => section.questions.length),
    [normalized],
  );

  return (
    <>
      <SiteHeader />
      <main>
        <section className="tech-grid relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -left-20 top-0 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="page-shell relative mx-auto max-w-3xl text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-white/10 text-cyan-300">
              <CircleHelp size={25} />
            </span>
            <p className="eyebrow mt-5 text-cyan-300">Qendra e ndihmës</p>
            <h1 className="display mt-3 text-4xl font-bold sm:text-5xl">Si mund t’ju ndihmojmë?</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Përgjigje të qarta për rezervime, llogarinë, pagesat dhe publikimin e biznesit.
            </p>
            <label className="relative mx-auto mt-7 block max-w-xl text-left">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-2xl border border-white/20 bg-white px-11 py-3.5 text-slate-900 outline-none ring-cyan-400 placeholder:text-slate-500 focus:ring-2"
                placeholder="Kërko një pyetje, p.sh. SMS ose anulim"
              />
            </label>
          </div>
        </section>
        <section className="page-shell max-w-4xl py-12 sm:py-16">
          {results.length ? (
            results.map((section) => (
              <section key={section.title} className="mb-10">
                <h2 className="display text-2xl font-bold">{section.title}</h2>
                <div className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                  {section.questions.map(([question, answer]) => (
                    <details key={question} className="group p-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-slate-900">
                        <span>{question}</span>
                        <ChevronDown
                          className="shrink-0 text-forest transition group-open:rotate-180"
                          size={19}
                        />
                      </summary>
                      <p className="max-w-3xl pt-3 leading-7 text-slate-600">{answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 text-center">
              <CircleHelp className="mx-auto text-forest" size={30} />
              <h2 className="mt-3 text-xl font-bold">Nuk gjetëm përgjigje për këtë kërkim.</h2>
              <p className="mt-2 text-slate-600">
                Provo fjalë të tjera ose shkruaj pyetjen tënde te chatboti “Ndihmë”.
              </p>
            </div>
          )}
          <section className="rounded-3xl bg-green-50 p-7 text-center sm:p-9">
            <Mail className="mx-auto text-forest" size={28} />
            <h2 className="display mt-3 text-2xl font-bold">Ende ju duhet ndihmë?</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              Hyni në llogari dhe na shkruani nga butoni “Ndihmë”. Pyetja ruhet te ekipi ynë i
              mbështetjes.
            </p>
            <Link className="mt-5 inline-block" to="/login">
              <Button>Hyr në llogari</Button>
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}
