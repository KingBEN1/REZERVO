import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Languages } from 'lucide-react';
import { translateUiText, type UiLocale } from './ui-translations';

const messages = {
  sq: { home: 'Ballina', discover: 'Zbulo bizneset', login: 'Hyr', startFree: 'Fillo 30 ditë falas', dashboard: 'Paneli', bookings: 'Rezervimet', services: 'Shërbimet', staff: 'Stafi', customers: 'Klientët', settings: 'Parametrat', bookNow: 'Rezervo tani', available: 'E lirë', confirmed: 'Konfirmuar', cancelled: 'Anuluar', noBookings: 'Ende nuk ka rezervime.', myBookings: 'Rezervimet e mia', about: 'Rreth nesh', businesses: 'Për bizneset', logout: 'Dil', account: 'Llogaria ime', createAccount: 'Krijo llogari', language: 'Ndrysho gjuhën' },
  en: { home: 'Home', discover: 'Discover businesses', login: 'Log in', startFree: 'Start 30 days free', dashboard: 'Dashboard', bookings: 'Bookings', services: 'Services', staff: 'Staff', customers: 'Customers', settings: 'Settings', bookNow: 'Book now', available: 'Available', confirmed: 'Confirmed', cancelled: 'Cancelled', noBookings: 'No bookings yet.', myBookings: 'My bookings', about: 'About us', businesses: 'For businesses', logout: 'Log out', account: 'My account', createAccount: 'Create account', language: 'Change language' },
} as const;
type Locale = keyof typeof messages;
type Key = keyof typeof messages.sq;
const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: Key) => string; tr: (sq: string, en: string) => string }>({ locale: 'sq', setLocale: () => undefined, t: (key) => messages.sq[key], tr: (sq) => sq });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>((localStorage.getItem('rezervo-locale') as Locale) || 'sq');
  const originalsRef = useRef(new WeakMap<Node, string>());
  const attributeOriginalsRef = useRef(new WeakMap<Element, Map<string, string>>());
  const update = (next: Locale) => { localStorage.setItem('rezervo-locale', next); document.documentElement.lang = next; setLocale(next); };
  useEffect(() => {
    document.documentElement.lang = locale;
    const originals = originalsRef.current;
    const attributeOriginals = attributeOriginalsRef.current;
    let observer: MutationObserver;
    const apply = (root: Node) => {
      observer?.disconnect();
      const nodes: Node[] = [root];
      if (root instanceof Element || root instanceof Document) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) nodes.push(walker.currentNode);
      }
      for (const node of nodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) continue;
        const known = originals.get(node);
        const expected = known ? translateUiText(known, locale as UiLocale) : undefined;
        if (!known || (locale === 'en' && node.nodeValue !== expected)) originals.set(node, node.nodeValue);
        const source = originals.get(node)!;
        node.nodeValue = translateUiText(source, locale as UiLocale);
      }
      const elements = root instanceof Element
        ? [root, ...Array.from(root.querySelectorAll('*'))]
        : root instanceof Document ? Array.from(root.querySelectorAll('*')) : [];
      for (const element of elements) {
        const stored = attributeOriginals.get(element) ?? new Map<string, string>();
        for (const name of ['placeholder', 'title', 'aria-label']) {
          const current = element.getAttribute(name);
          if (!current) continue;
          const known = stored.get(name);
          const expected = known ? translateUiText(known, locale as UiLocale) : undefined;
          if (!known || (locale === 'en' && current !== expected)) stored.set(name, current);
          element.setAttribute(name, translateUiText(stored.get(name)!, locale as UiLocale));
        }
        if (stored.size) attributeOriginals.set(element, stored);
      }
      observer?.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
    };
    observer = new MutationObserver(() => apply(document.body));
    apply(document.body);
    return () => observer.disconnect();
  }, [locale]);
  return <I18nContext.Provider value={{ locale, setLocale: update, t: (key) => messages[locale][key], tr: (sq, english) => locale === 'sq' ? sq : english }}>{children}</I18nContext.Provider>;
}
export const useI18n = () => useContext(I18nContext);

export function GlobalLanguageSwitch() {
  const { locale, setLocale } = useI18n();
  return <button type="button" onClick={() => setLocale(locale === 'sq' ? 'en' : 'sq')} title={locale === 'sq' ? 'Switch to English' : 'Kalo në shqip'} aria-label={locale === 'sq' ? 'Switch to English' : 'Kalo në shqip'} className="fixed bottom-4 right-4 z-[70] flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/90 px-3 text-xs font-extrabold text-slate-700 shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-indigo-700"><Languages size={16} /> {locale === 'sq' ? 'EN' : 'SQ'}</button>;
}
