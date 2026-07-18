# Detektivky.cz

Web pro detektivní krabicové hry. Zákazník dostane domů fyzickou krabici se
spisem (fotky, dokumenty, stopy) a k ní jedinečné přihlašovací jméno a heslo
pro tento portál, kde najde odposlechy, zachycené e-maily a databázi osob z
případu, a kde nakonec podá obvinění.

Stack: Next.js 16 (App Router, Turbopack), TypeScript, PostgreSQL + Prisma 7,
Tailwind CSS v4. Žádná externí auth služba — přihlašování je vlastní řešení
šité na míru modelu "jméno a heslo na krabici", postavené podle
[doporučeného vzoru Next.js pro autentizaci](https://nextjs.org/docs/app/guides/authentication).

## Jak to běží

```
src/
  app/
    page.tsx                marketingová homepage (/)
    prihlaseni/              přihlášení zákazníka (kód + heslo z krabice)
    portal/                  chráněná zóna zákazníka
      spis/                  úvod případu, osoby
      dukazy/                fotky, dokumenty, poznámky
      odposlechy/             audio + přepisy
      emaily/                 zachycená komunikace
      databaze/               vyhledávání v osobách (client-side filtr)
      reseni/                 podání obvinění, historie pokusů
    admin/
      prihlaseni/             přihlášení administrátora
      (protected)/            dashboard: případy, generování krabic
        pripady/[caseId]/      správa obsahu případu — osoby (vč. pachatele),
                                důkazy, odposlechy, e-maily (create/edit/delete)
    actions/                 Server Actions (přihlášení, obvinění, admin)
  lib/
    session.ts               šifrované session cookies (jose, JWE)
    auth.ts                  hashování hesel (bcrypt), generování kódů
    rateLimit.ts              rate limiting + zamykání účtů
    dal.ts                    Data Access Layer — jediné místo, kde se
                              ověřuje session a autorizace k datům
    dto.ts                    explicitní výběr polí bezpečných pro klienta
  proxy.ts                    security headers, optimistický redirect gate
prisma/
  schema.prisma               datový model
  seed.ts                     demo případ + demo krabice + demo admin
```

## Bezpečnostní opatření

- **Hesla**: bcrypt, cost 12. Nikdy neukládáme plaintext hesla krabic ani
  administrátorů — hesla krabic se zobrazí administrátorovi přesně **jednou**
  při vytvoření (viz `createBox` v `src/app/actions/admin.ts`), poté existuje
  jen hash.
- **Session cookies**: `HttpOnly`, `Secure` (v produkci), `SameSite=Lax`,
  šifrované (JWE/A256GCM přes `jose`) — obsah cookie není čitelný ani
  klientským JS, ani prohlížečem. Krátká platnost (12 h zákazník, 8 h admin).
- **Autorizace na dvou úrovních** (podle doporučení Next.js): `proxy.ts` dělá
  jen optimistickou kontrolu (existuje cookie?) a přesměruje dřív, než se
  cokoliv vyrenderuje. Skutečná autorizace — ověření session proti databázi,
  kontrola že krabice/případ je aktivní — se děje v `src/lib/dal.ts` na
  každé chráněné stránce a v každé Server Action. Prohlížeč nikdy nedostane
  data, ke kterým DAL nedal svolení.
- **Řešení případu se nikdy neposílá klientovi**: pole `Person.isCulprit` je
  z výběrů (`select`) pro zákaznický portál záměrně vynecháno
  (`src/lib/dto.ts`), takže ani neopatrné budoucí úpravy ho nemůžou omylem
  poslat do prohlížeče. Vyhodnocení obvinění běží čistě na serveru
  (`submitAccusation` v `src/app/actions/case.ts`).
- **Rate limiting a account lockout**: 5 chybných pokusů o přihlášení
  zamkne konkrétní účet (krabici i admina) na 15 minut; navíc se sleduje
  počet pokusů z jedné IP napříč účty (ochrana proti hádání kódů/hesel
  hromadně). Viz `src/lib/rateLimit.ts`.
- **Ochrana proti odhalení existujících účtů (enumeration)**: neplatný kód
  krabice i neplatné heslo vrací naprosto stejnou chybovou hlášku. Když kód
  neexistuje, stejně se provede jeden "naprázdno" bcrypt compare, aby
  odpověď trvala stejně dlouho jako u existujícího účtu (žádný časový
  side-channel).
- **CSRF**: přihlášení, odhlášení, obvinění i administrace běží přes Next.js
  Server Actions, které mají zabudovanou ochranu (ověření Origin hlavičky,
  neuhodnutelné action ID) — není potřeba vlastní CSRF token.
- **CSP**: přísná, nonce-based Content-Security-Policy generovaná v
  `proxy.ts` pro každý request zvlášť (`script-src 'nonce-…' 'strict-dynamic'`),
  bez `unsafe-inline`. K tomu `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  a HSTS v produkci.
- **Audit log**: každé přihlášení (úspěšné i neúspěšné), podané obvinění a
  administrátorská akce (vytvoření případu/krabice, zablokování, reset
  hesla) se loguje do `AuditLog` s IP adresou a časem.
- **`noindex`** na administraci a robots metadata, ať se do vyhledávačů
  nedostane přihlašovací stránka administrace.

### Co je potřeba doplnit před ostrým nasazením

Toto je funkční kostra, ne hotový produkt. Než půjde web zákazníkům:

- **Ukládání médií** (fotky, PDF, audio odposlechů) — teď se počítá s
  `url` směřující na stejnou doménu (kvůli CSP `img-src`/`media-src 'self'`).
  V produkci se hodí S3/R2 + CDN a buď rozšíření CSP o tu konkrétní doménu,
  nebo proxy přes vlastní API route.
- **2FA pro administrátory** (aspoň TOTP) — teď je jen heslo.
- **Redis/Upstash pro rate limiting**, pokud poběží víc instancí serveru
  (aktuální řešení počítá útoky přes Postgres, což je v pořádku pro jeden
  region, ale při horizontálním škálování je rychlejší mít sdílenou
  in-memory store).
- **E-mail zákazníkovi** s přihlašovacími údaji po objednávce (teď je vidí
  jen admin v UI po vytvoření krabice) — napojení na objednávkový/e-shop
  systém.
- **Nahrávání souborů z UI**: admin panel (`/admin/pripady/[id]`) už umí
  spravovat osoby, důkazy, odposlechy i e-maily bez zásahu do databáze —
  chybí jen upload fotek/PDF/audia přímo z prohlížeče (teď se zadává URL,
  viz bod o ukládání médií výše).
- **Zálohy databáze** a monitoring/alerting na neobvyklé množství
  neúspěšných přihlášení.
- **GDPR**: cookie lišta / privacy policy stránka, retention politika pro
  `LoginAttempt`/`AuditLog`.

## Lokální vývoj

```bash
npm install
cp .env.example .env   # a doplň DATABASE_URL + SESSION_SECRET
npx prisma migrate dev
npx prisma db seed
npm run dev
```

`SESSION_SECRET` musí mít alespoň 32 znaků — vygeneruj např.
`openssl rand -base64 32`.

Po seedu se do konzole vypíšou přihlašovací údaje k demo případu (kód a
heslo krabice) a demo administrátora.

- Zákaznický vstup: `/prihlaseni`
- Administrace: `/admin/prihlaseni`

## Nasazení

Doporučený postup: Vercel (Next.js) + spravovaný Postgres (Neon, Supabase,
Vercel Postgres…). Nastav proměnné prostředí `DATABASE_URL` a
`SESSION_SECRET` v nastavení projektu, spusť `npx prisma migrate deploy`
jako součást buildu/release kroku a nikdy neposílej `.env` do gitu.
