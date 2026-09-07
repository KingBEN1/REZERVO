# Publikimi i Rezervo

## Para deploy-it

1. Krijoni PostgreSQL të menaxhuar dhe ruani `DATABASE_URL` vetëm te hosti.
2. Krijoni dy domain-e HTTPS, p.sh. `www.domaini-juaj.com` për web dhe `api.domaini-juaj.com` për API.
3. Gjeneroni dy sekrete të ndryshme me së paku 32 karaktere për `JWT_SECRET` dhe `COOKIE_SECRET`.
4. Vendosni vlerat nga `apps/api/.env.production.example` te API-ja dhe `VITE_API_URL` te hosti i web-it.
5. Në API, ekzekutoni një herë para startimit: `npm run db:migrate`.
6. Nëse dëshironi të shfaqen bizneset shembull, ekzekutoni edhe `npm run db:seed` vetëm në mjedisin demo/staging. Mos e ekzekutoni seed-in në databazën reale pasi të keni klientë.
7. Verifikoni `https://api.domaini-juaj.com/health`: duhet të kthejë `database: ok`.

## Render + Vercel

- API: lidheni repository-n me Render. `render.yaml` përmban konfigurimin fillestar; plotësoni vetë `DATABASE_URL`, `WEB_ORIGIN` dhe `API_PUBLIC_URL`.
- Web: deploy `apps/web` në Vercel ose Netlify. Vendosni `VITE_API_URL=https://api.domaini-juaj.com/api` në production dhe rindërtoni web-in.
- Database: përdorni PostgreSQL të menaxhuar me backup automatik. Mos përdorni databazën lokale të kompjuterit në prodhim.

## Kontrolli para hapjes për klientë

- Regjistro një biznes testues, plotëso profilin, orarin, ekipin/burimin dhe një ofertë, pastaj publikoje.
- Bëj një rezervim si klient; provo ndryshimin, anulimin dhe vlerësimin pasi ta shënosh si të përfunduar.
- Provo një dhomë hoteli me hyrje/dalje dhe një taksi me nisje/destinacion.
- Krijo një biznes të ri: pronari duhet së pari të verifikojë emailin, pastaj të dërgojë emrin ligjor, numrin e regjistrimit/NUI dhe kontaktin. Hyni si `SUPER_ADMIN`, kontrolloni kërkesën dhe shtypni **Mirato**. Vetëm më pas biznesi mund të bëhet aktiv publikisht.
- Kontrollo që fotoja e ngarkuar hapet nga domain-i i API-së dhe lidhja e hartës hap adresën e saktë.
- Kontrollo login/logout nga domain-i i web-it, jo vetëm nga localhost.
- Kryej rikthim prove nga backup-i i databazës.

## Çfarë kërkon llogari të jashtme

Pagesat me kartë, SMS, WhatsApp Business dhe ruajtja cloud e fotove nuk duhen aktivizuar me `console`, `none` ose `local` në prodhim. Ato kërkojnë një ofrues të zgjedhur, kontratë/llogari, çelësa privatë dhe testim të webhook-ve. Emaili transaksional mbështet `EMAIL_PROVIDER="resend"`; vendosni `EMAIL_API_KEY` dhe një `EMAIL_FROM` të verifikuar te hosti. Mos vendos kurrë çelësa privatë në frontend ose në Git.

## Kontrollet e sigurisë para lançimit

- Vendosni `NODE_ENV="production"`, URL HTTPS për `WEB_ORIGIN` dhe `API_PUBLIC_URL`, dhe sekrete të reja e të ndryshme për JWT/cookie. Aplikacioni refuzon sekrete zhvillimi në production.
- Lëreni CORS vetëm për domain-in e web-it; mos përdorni `*` kur përdoren cookies.
- Mbani PostgreSQL me backup automatik, kufizim të rrjetit dhe kredenciale të veçanta për production.
- Për verifikime reale, administratori duhet të krahasojë NUI-n, emrin ligjor dhe kontaktin me burim zyrtar para miratimit. Aplikacioni ruan gjurmë auditi për dërgimin dhe vendimin e verifikimit.
- Aktivizoni monitorim për `/health`, kopje rezervë dhe alarm për gabime para se ta ndani domain-in me klientë.
