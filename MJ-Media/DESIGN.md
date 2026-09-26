# MJ media – design manuál

## Logo

Značka je tvořena červeným čtvercem se zaoblenými rohy a bílým geometrickým monogramem **MJ**, kde hák písmene J plynule navazuje na pravou nohu M (ligatura). Vedle značky stojí nápis **MJ** (tučně) a **media** (regular, tmavě šedá).

| Soubor | Použití |
|---|---|
| `public/logo.svg` | Plné logo (značka + nápis) na světlém pozadí |
| `public/logo-inverse.svg` | Plné logo na tmavém pozadí |
| `public/logo-mark.svg` | Samotná značka (avatar, sociální sítě, aplikace) |
| `public/favicon.svg` | Favicon / ikona záložky |

Logo se na webu vykresluje komponentou `src/components/Logo.tsx`, takže barvu a velikost lze měnit na jednom místě. Ochranná zóna: minimálně výška písmene „M“ ze značky na všech stranách. Minimální velikost značky: 16 px.

## Barvy

| Token | Hex | Použití |
|---|---|---|
| paper | `#FAFAF8` | pozadí stránky (teplá bílá) |
| surface | `#FFFFFF` | karty, formuláře |
| ink | `#111111` | text, titulky, silné linky |
| ink-2 | `#3D3D3D` | perex, sekundární text |
| muted | `#6F6F6F` | metadata, datumy |
| line | `#E6E4DF` | jemné oddělovací linky |
| accent | `#D42B1E` | značka, názvy rubrik, odkazy v textu, „živé“ prvky |
| accent-dark | `#A81F14` | hover akcentu |
| ok / warn | `#2E6B4F` / `#B8860B` | stavy v administraci |

Akcent se používá střídmě: rubrika nad titulkem, podtržení odkazu, časová značka v panelu Nejnovější, tlačítko Publikovat. Vše ostatní je černobílé.

## Typografie

- **Titulky a tělo článku:** Newsreader (Google Fonts, proměnná osa optické velikosti). Titulky váha 600, záporný prostrkání −0,015 em.
- **UI, navigace, metadata, administrace:** Inter.
- Názvy rubrik: Inter 700, verzálky, prostrkání 0,1 em, akcentová červená.
- Tělo článku: 1,2 rem / 1,65, šířka sloupce 48 rem (cca 70 znaků).

## Rozvržení

- Hlavička: tenký řádek s datem a servisními odkazy, logo s vyhledáváním, navigace rubrik oddělená silnou linkou nahoře (2 px, ink) a tenkou dole.
- Úvodní strana: hlavní článek (obrázek + titulek), tři karty, vpravo panel **Nejnovější** s časovými značkami v červené (odkaz na živý tok ČT24), níže dvousloupcový seznam a sekce rubrik ve čtyřech sloupcích.
- Sekce začínají 2 px linkou v barvě ink a názvem v Interu (odkaz na Deník N).
- Článek: drobečková navigace, rubrika, velký titulek, perex v serifu, řádek s autorem/datem/dobou čtení, úvodní obrázek přes širší sloupec, tělo v úzkém sloupci, štítky a sdílení, „Mohlo by vás zajímat“.
- Administrace: levý postranní panel (bílý) s aktivní položkou v ink, obsah na paper, karty s 10 px zaoblením. Primární tlačítko ink, publikační tlačítko accent.

## Tón

Klidný, věcný, bez křiku. Žádné stíny, gradienty ani dekorace; hierarchii dělá typografie, linky a jedna barva.
