# MJ media

Nezávislé online médium: veřejný web + redakční administrace. Světlý, minimalistický design inspirovaný Deníkem N a ČT24.

## Spuštění

```bash
cd MJ-Media
npm install
cp .env.example .env      # nastavte ADMIN_PASSWORD a ADMIN_SECRET
npm run dev               # http://localhost:3000
```

Produkce:

```bash
npm run build
npm start                 # PORT=3000 (lze změnit proměnnou PORT)
```

Databáze (SQLite) se vytvoří automaticky v `data/mjmedia.db` a naplní se ukázkovými články a rubrikami. Nahrané obrázky se ukládají do `data/uploads/`. Složku `data/` zálohujte, obsahuje celý obsah webu.

## Administrace

- Přihlášení: `/prihlaseni` (heslo z `ADMIN_PASSWORD` v `.env`, výchozí `admin` pokud není nastaveno)
- Přehled: `/admin` – statistiky, naposledy upravené, koncepty, naplánované, nejčtenější
- Články: `/admin/clanky` – filtr podle stavu a rubriky, hledání, rychlé publikování, mazání
- Editor: Markdown s nástrojovou lištou, náhled (Psaní / Vedle sebe / Náhled), nahrávání obrázků (tlačítkem, přetažením nebo Ctrl+V), úvodní obrázek, rubrika, štítky, datum publikace (budoucí datum = naplánováno), hlavní článek, SEO titulek a popis, Ctrl/⌘+S uloží
- Rubriky: `/admin/rubriky` – přidání, přejmenování, pořadí v navigaci, mazání
- Média: `/admin/media` – knihovna obrázků s popisky (alt) a kopírováním URL
- Nastavení: `/admin/nastaveni` – název webu, slogan, O nás, patička, kontakt a sociální sítě

## Veřejný web

- `/` úvodní strana: hlavní článek, mřížka, panel „Nejnovější“, další články, sekce rubrik
- `/clanek/[slug]` článek, `/rubrika/[slug]` rubrika se stránkováním, `/tema/[slug]` štítek
- `/hledat` fulltextové hledání, `/o-nas`
- `/rss.xml`, `/sitemap.xml`, `/robots.txt`

## Technologie

Next.js 16 (App Router, server actions), React 19, Tailwind CSS 4, better-sqlite3, marked. Žádné externí služby – běží na jednom serveru s Node.js 20+.

## Nasazení

Libovolný VPS/Node hosting: `npm run build && npm start` za reverzní proxy (nginx, Caddy). Nastavte `SITE_URL` na veřejnou adresu (kvůli RSS, sitemap a sdílení) a `secure` cookie vyžaduje HTTPS v produkci.

Design a logo: viz [DESIGN.md](DESIGN.md).
