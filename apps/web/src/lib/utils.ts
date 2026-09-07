import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function money(value: string | number, currency = 'EUR') {
  return new Intl.NumberFormat('sq-XK', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value));
}

export function dateTime(value: string) {
  // `Europe/Pristina` is not available in every browser's Intl data. Belgrade
  // uses the same civil time rules for Kosovo and is universally recognised.
  return new Intl.DateTimeFormat('sq-XK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Belgrade' }).format(new Date(value));
}

export function localIsoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
