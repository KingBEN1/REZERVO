/**
 * The product-facing Kosovo setting remains Europe/Pristina. Some Windows
 * Node runtimes omit that IANA alias; Europe/Belgrade has the same current
 * Kosovo civil-time/DST rules and is available in those runtimes.
 */
export function runtimeTimezone(timezone: string) {
  if (timezone === 'Europe/Pristina') return 'Europe/Belgrade';
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone });
    return timezone;
  } catch {
    return 'Europe/Belgrade';
  }
}
