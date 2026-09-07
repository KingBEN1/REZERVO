import { createContext, useContext, useState, type ReactNode } from 'react';

const messages = {
  sq: { home: 'Ballina', discover: 'Zbulo bizneset', login: 'Hyr', startFree: 'Fillo 30 ditë falas', dashboard: 'Paneli', bookings: 'Rezervimet', services: 'Shërbimet', staff: 'Stafi', customers: 'Klientet', settings: 'Parametrat', bookNow: 'Rezervo tani', available: 'E lirë', confirmed: 'Konfirmuar', cancelled: 'Anuluar', noBookings: 'Ende nuk ka rezervime.' },
  en: { home: 'Home', discover: 'Discover businesses', login: 'Log in', startFree: 'Start free', dashboard: 'Dashboard', bookings: 'Bookings', services: 'Services', staff: 'Staff', customers: 'Customers', settings: 'Settings', bookNow: 'Book now', available: 'Available', confirmed: 'Confirmed', cancelled: 'Cancelled', noBookings: 'No bookings yet.' },
} as const;
type Locale = keyof typeof messages;
type Key = keyof typeof messages.sq;
const I18nContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void; t: (key: Key) => string }>({ locale: 'sq', setLocale: () => undefined, t: (key) => messages.sq[key] });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>((localStorage.getItem('rezervo-locale') as Locale) || 'sq');
  const update = (next: Locale) => { localStorage.setItem('rezervo-locale', next); setLocale(next); };
  return <I18nContext.Provider value={{ locale, setLocale: update, t: (key) => messages[locale][key] }}>{children}</I18nContext.Provider>;
}
export const useI18n = () => useContext(I18nContext);
