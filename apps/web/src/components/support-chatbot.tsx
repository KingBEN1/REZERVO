import { Bot, ChevronRight, MessageCircle, Send, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Topic = { title: string; answer: string; to?: string; action?: string };

const topics: Topic[] = [
  { title: 'Si bëj rezervim?', answer: 'Zgjidh biznesin, shërbimin, personin ose burimin, datën dhe termin. Pastaj verifiko emailin ose numrin tënd.', to: '/businesses', action: 'Gjej biznes' },
  { title: 'Si e anuloj termin?', answer: 'Hap lidhjen “Menaxho termin” nga emaili i konfirmimit ose shiko rezervimet te llogaria jote.', to: '/account', action: 'Rezervimet e mia' },
  { title: 'Nuk më erdhi kodi', answer: 'Kontrollo Spam/Junk për email. Për SMS, kontrollo prefiksin ndërkombëtar dhe provo përsëri pas pak.' },
  { title: 'Dua të krijoj biznes', answer: 'Krijo llogari biznesi falas, zgjidh kategorinë dhe plotëso shërbimet ose burimet e tua.', to: '/for-business', action: 'Për bizneset' },
];

export function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Topic>();
  const location = useLocation();
  if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) return null;
  return <div className="fixed bottom-5 right-5 z-[60]">
    {open && <section className="mb-3 w-[min(23rem,calc(100vw-2.5rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <header className="flex items-center justify-between bg-gradient-to-r from-forest to-teal-700 px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white/15"><Bot size={19} /></span><div><b className="block text-sm">Asistenti Rezervo</b><small className="text-green-100">Përgjigje të shpejta</small></div></div><button type="button" aria-label="Mbyll chatin" onClick={() => setOpen(false)}><X size={19} /></button></header>
      <div className="max-h-[26rem] overflow-y-auto p-4"><div className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">Përshëndetje! Si mund të të ndihmoj?</div>{selected ? <div className="mt-3 rounded-2xl bg-green-50 p-3 text-sm leading-6 text-green-950"><b className="block">{selected.title}</b><p className="mt-1">{selected.answer}</p>{selected.to && <Link onClick={() => setOpen(false)} to={selected.to} className="mt-3 inline-flex items-center gap-1 font-bold text-forest">{selected.action} <ChevronRight size={15} /></Link>}</div> : <div className="mt-3 space-y-2">{topics.map((topic) => <button key={topic.title} type="button" onClick={() => setSelected(topic)} className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-forest/40 hover:bg-green-50">{topic.title}<ChevronRight size={16} className="text-forest" /></button>)}</div>}</div>
      {selected && <footer className="border-t border-line p-3"><button type="button" onClick={() => setSelected(undefined)} className="text-sm font-bold text-forest">← Pyetje të tjera</button></footer>}
    </section>}
    <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full bg-forest px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-teal-800" aria-expanded={open}><MessageCircle size={19} /> {open ? 'Mbyll' : 'Ndihmë'}<Send size={15} /></button>
  </div>;
}
