import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.rezervoks.com';
const BRAND = 'Rezervo';

type SeoProps = {
  title: string;
  description: string;
  canonical?: string;
  noIndex?: boolean;
  image?: string | null;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function setMeta(selector: string, attribute: 'name' | 'property', value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, selector.match(/="([^"]+)/)?.[1] ?? '');
    document.head.appendChild(element);
  }
  element.content = value;
}

/**
 * Keeps titles, descriptions, canonical URLs and rich-result metadata in sync
 * in the Vite SPA. This also makes every page shareable with a useful preview.
 */
export function Seo({
  title,
  description,
  canonical,
  noIndex = false,
  image,
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const pageTitle = title.includes(BRAND) ? title : `${title} | ${BRAND}`;
    const pageUrl = canonical ?? `${SITE_URL}${window.location.pathname}`;
    document.title = pageTitle;
    setMeta('meta[name="description"]', 'name', description);
    setMeta('meta[name="robots"]', 'name', noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    setMeta('meta[property="og:title"]', 'property', pageTitle);
    setMeta('meta[property="og:description"]', 'property', description);
    setMeta('meta[property="og:url"]', 'property', pageUrl);
    setMeta('meta[name="twitter:title"]', 'name', pageTitle);
    setMeta('meta[name="twitter:description"]', 'name', description);
    if (image) {
      setMeta('meta[property="og:image"]', 'property', image);
      setMeta('meta[name="twitter:card"]', 'name', 'summary_large_image');
    }

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = pageUrl;

    const previous = document.getElementById('rezervo-structured-data');
    if (previous) previous.remove();
    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'rezervo-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData).replace(/</g, '\\u003c');
      document.head.appendChild(script);
    }

    return () => document.getElementById('rezervo-structured-data')?.remove();
  }, [title, description, canonical, noIndex, image, structuredData]);

  return null;
}

const staticPages: Array<{ match: (path: string) => boolean; title: string; description: string; noIndex?: boolean }> = [
  { match: (path) => path === '/', title: 'Rezervo - Rezervime online në Kosovë', description: 'Gjeni, krahasoni dhe rezervoni hotele, taksi, bukuri, shëndetësi dhe shërbime në Kosovë.' },
  { match: (path) => path === '/businesses', title: 'Zbulo bizneset', description: 'Kërko biznese lokale dhe rezervo online sipas kategorisë, qytetit, çmimit dhe disponueshmërisë.' },
  { match: (path) => path === '/for-business', title: 'Rezervime online për biznesin tënd', description: 'Krijo faqen e biznesit, menaxho kalendarin, ekipin dhe rezervimet nga një panel profesional.' },
  { match: (path) => path === '/pricing', title: 'Çmimet për biznese', description: '30 ditët e para falas. Zgjidhja Rezervo për menaxhimin e rezervimeve online.' },
  { match: (path) => path === '/promote', title: 'Promovo biznesin', description: 'Vendose biznesin tënd në qendër të vëmendjes dhe fito më shumë kërkesa për rezervim.' },
  { match: (path) => path === '/about', title: 'Rreth Rezervo', description: 'Rezervo lidh klientët me bizneset e Kosovës për rezervime të qarta, të shpejta dhe të sigurta.' },
  { match: (path) => path === '/help', title: 'Ndihmë dhe pyetje të shpeshta', description: 'Përgjigje për rezervimet, llogarinë, pagesat dhe publikimin e biznesit.' },
  { match: (path) => path === '/contact', title: 'Kontakt dhe mbështetje', description: 'Merrni ndihmë për llogarinë, rezervimin ose biznesin tuaj në Rezervo.' },
  { match: (path) => path === '/terms', title: 'Kushtet e përdorimit', description: 'Kushtet e përdorimit të platformës Rezervo.' },
  { match: (path) => path === '/privacy', title: 'Politika e privatësisë', description: 'Si përdoren dhe mbrohen të dhënat në platformën Rezervo.' },
];

export function RouteSeo() {
  const { pathname } = useLocation();
  const staticPage = staticPages.find((page) => page.match(pathname));
  const privatePage = /^\/(account|dashboard|admin|onboarding|login|register|forgot-password|reset-password|verify-email|manage)(\/|$)/.test(pathname);
  // The homepage adds Organization/WebSite structured data itself.
  if (pathname === '/') return null;
  if (staticPage) return <Seo {...staticPage} canonical={`${SITE_URL}${pathname}`} />;
  if (privatePage) return <Seo title="Llogaria" description="Llogaria juaj Rezervo." noIndex />;
  return null;
}

export const rezervoSiteUrl = SITE_URL;
