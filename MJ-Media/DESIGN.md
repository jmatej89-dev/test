# MJ media – design manuál

## Logo

Značka: červený čtverec se zaoblenými rohy a bílým geometrickým monogramem **MJ**. Hák písmene J plynule navazuje na pravou nohu M (ligatura), takže obě písmena tvoří jeden tah. Vedle značky stojí nápis **MJ** (tučně) a **media** (regular, tmavě šedá).

| Soubor | Použití |
|---|---|
| `public/logo.svg` | Plné logo na světlém pozadí |
| `public/logo-inverse.svg` | Plné logo na tmavém pozadí (patička) |
| `public/logo-mark.svg` | Samotná značka (avatar, sociální sítě, aplikace) |
| `public/favicon.svg` | Favicon |

Na webu logo vykresluje komponenta `src/components/Logo.tsx` (`inverse` pro tmavé pozadí). Ochranná zóna: výška písmene M ze značky. Minimální velikost značky 16 px.

## Barvy

| Token | Hex | Použití |
|---|---|---|
| paper | `#F8F7F4` | pozadí stránky (teplá bílá) |
| surface | `#FFFFFF` | karty, formuláře |
| ink | `#0F0F0F` | text, titulky, silné linky |
| ink-2 | `#3A3A3A` | perex, sekundární text |
| muted | `#6B6B6B` | metadata |
| line | `#E4E2DC` | oddělovací linky |
| wash | `#EFEDE8` | podkladové boxy (newsletter, autor) |
| accent | `#C8202B` | značka, názvy rubrik, časy v panelu Nejnovější, publikační tlačítka, iniciála článku |
| dark | `#141414` | tmavá sekce Názory a patička |

Akcent se používá střídmě. Vše ostatní je černobílé, včetně fotografií v ukázkovém obsahu (jednotný monochromatický styl s teplým tónem, 3:2).

## Typografie

Fonty jsou self-hostované v `public/fonts` (žádné volání Google Fonts, funguje i offline).

- **Titulky, perex, tělo článku:** Newsreader (proměnná osa optické velikosti; titulky `opsz 72`, tělo `opsz 18`).
- **UI, navigace, metadata, administrace:** Inter.
- Rubrika nad titulkem: Inter 700, verzálky, prostrkání 0,12 em, akcent.
- Názvy sekcí: Inter 700, verzálky, 0,8 rem, nad 2px linkou v barvě ink.
- Tělo článku 1,25 rem / 1,6, sloupec 48 rem, iniciála prvního odstavce v akcentu.

## Struktura úvodní strany

1. **Hlavička**: 4px červený pruh, servisní řádek (datum, slogan, O nás / RSS / Redakce), logo + hledání + tlačítko Odebírat, lepící navigace rubrik s malou značkou.
2. **Hlavní blok**: velký článek (foto 3:2 přes 8 sloupců, titulek pod ním) + dvě sekundární karty; vpravo panel **Nejnovější** s časy (červeně) a box Newsletter.
3. **Další zprávy**: čtyři malé karty + čtyři titulky ve dvou sloupcích.
4. **Názory a komentáře**: tmavý pás přes celou šířku, tři texty s uvozovkou a jménem autora.
5. **Z rubrik**: tři sloupce, každý s jednou kartou a třemi titulky.
6. **Nejčtenější** (číslovaný seznam) + **Témata** (štítky).
7. **Patička**: tmavá, logo v inverzi, popis, rubriky, odkazy, newsletter.

## Článek

Drobečková navigace, rubrika, titulek do 3,4 rem, perex v serifu, řádek s iniciálami autora, datem, dobou čtení a sdílením, foto 2:1 přes celou šířku, tělo v úzkém sloupci s iniciálou, štítky, box autora, newsletter, „Mohlo by vás zajímat“ + Nejnovější. Nahoře tenký červený ukazatel průběhu čtení.

## Administrace

Levý bílý panel s aktivní položkou v ink, obsah na paper, dlaždice statistik, tabulky s hlavičkou ve verzálkách. Primární tlačítko ink, publikační akce v akcentu.
