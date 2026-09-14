import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: { accounts: { id: { initialize(options: { client_id: string; callback: (result: { credential: string }) => void }): void; renderButton(element: HTMLElement, options: Record<string, unknown>): void } } };
    turnstile?: { render(element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; theme: string }): string; remove(id: string): void };
  }
}

function loadScript(id: string, src: string, ready: () => void) {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === 'true') ready();
    else existing.addEventListener('load', ready, { once: true });
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.defer = true;
  script.addEventListener('load', () => { script.dataset.loaded = 'true'; ready(); }, { once: true });
  document.head.appendChild(script);
}

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!clientId) return;
    const render = () => {
      if (!ref.current || !window.google) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: ({ credential }) => onCredential(credential) });
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: 400, text: 'continue_with' });
    };
    loadScript('google-identity', 'https://accounts.google.com/gsi/client', render);
  }, [clientId, onCredential]);
  if (!clientId) return null;
  return <div ref={ref} className="flex min-h-11 w-full justify-center overflow-hidden" />;
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sitekey) return;
    let widgetId: string | undefined;
    const render = () => {
      if (!ref.current || !window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(ref.current, { sitekey, theme: 'light', callback: onToken, 'expired-callback': () => onToken('') });
    };
    loadScript('cloudflare-turnstile', 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', render);
    return () => { if (widgetId && window.turnstile) window.turnstile.remove(widgetId); };
  }, [onToken, sitekey]);
  if (!sitekey) return null;
  return <div ref={ref} className="min-h-[65px] overflow-hidden" />;
}
