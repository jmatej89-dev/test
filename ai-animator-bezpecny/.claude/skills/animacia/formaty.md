# Formáty, ktoré fungujú (podľa virálnych 3D videí, október 2026)

Vyber formát podľa témy. Každý má vzorec skriptu a vzorec obrazu. Čísla = reálne videá, z ktorých vzorec vychádza.

---

## 1. „Ako sa z X stane Y“ – vysvetľovačka v jednom svete
*Dude Facts: „Ako sa jama na dvore stane atómovým krytom“ – 23,4 mil. videní, 1,56 mil. lajkov.*

**Skript (60–95 s, ~2,7 slova/s):**
1. Háčik = naivná verzia: „Ak si na dvore vykopeš jamu a skočíš do nej, keď spadne bomba, máš kryt.“
2. Slučka 8–12×: **„Ale [konkrétny problém]. Tak [riešenie]. Toto je [pojem].“** Každé riešenie vytvorí ďalší problém → divák ostáva.
3. Detské prirovnania (ako špongia, ako domino), jedno číslo na krok (1 meter, 99,9 %, pár tisícin sekundy).
4. Okolo 80 %: vyvrátenie mýtu („Väčšina ľudí si myslí… Nie.“).
5. Koniec: „Pridaj [3 útulné veci]. Gratulujem, postavil si [Y].“

**Obraz:** jeden stály svet (dvor s rezom pôdy `rez_pody`, dom, plot, maskot). Každé riešenie sa PRIDÁ do toho istého sveta, kamera sa medzi časťami presúva plynulo. Pri „Ale…“ rýchly pohyb/otras, pri „Toto je…“ `pojem(...)`.

---

## 2. „Prečo…?“ – otázka a prekvapivá odpoveď
*Whyrd: „Holuby nekývajú hlavou“ – 305 tis. lajkov. Naša ukážka `priklady/lietadla`.*

**Skript (20–40 s):**
1. Otázka alebo tvrdenie proti intuícii: „Holuby nekývajú hlavou. Držia ju na mieste.“
2. Čo vidíme / čo si myslíme (1–2 vety).
3. Odhalenie skutočnosti + jedno prirovnanie + jedno overené číslo.
4. Pointa jednou vetou („Klame tvoja mapa.“ / „Hlava je kamera.“).

**Obraz:** jedna hlavná vec v štúdiu alebo na mape (`init(pozadie=...)`, `ZemMapa`, zviera z primitív). Detailné zábery, pomalé najazdy, jeden „wow“ prechod (napr. mapa → glóbus).

---

## 3. Príbeh s napätím (séria)
*Stickocalypse: „Posledná farma – zombie apokalypsa, časť 1“ – 18,5 mil. videní.*

**Skript (45–65 s):**
1. Háčik = rada v kríze: „Ak zombie apokalypsa začne, keď si na farme, neutekaj do mesta.“
2. Postava s menom (Eli) + časový tlak („má asi 30 minút“).
3. 3 stupňujúce sa problémy, každý s riešením a novou komplikáciou (voda → generátor → hluk láka…).
4. Konkrétne počty (30 sliepok, 12 kráv, 1 kôň).
5. Cliffhanger: „Bol tu len jeden problém – niekto už bol vo vnútri plota.“ + „Pokračovanie v časti 2.“

**Obraz:** diorama (farma: `teren`, `dom`, `plot`, zvieratá z primitív), postavička, svetlo `zlata` → `noc` pri napätí, dym, pomalé priblíženie na koniec.

---

## 4. Krátke podobenstvo (10–15 s, skoro bez reči)
*thequietfixx: „Smiali sa, kým nevyliezol hore“ – 35,4 mil. videní. Neuron Visuals: dáma vs. šach – 199 tis. lajkov.*

**Skript:** 0–2 vety alebo len text na obraze („Jeden myslí na ďalší ťah. Druhý tri ťahy dopredu.“). Nesie to hudba a jasný obraz.
**Obraz:** jedna silná metafora, 2 postavičky, jasný kontrast (hore/dole, malý/veľký), jedna zmena v strede. `zloz.py --titulky ziadne --nadpis "…"`.

---

## 5. Interaktívna séria (publikum stavia s tebou)
*Interaktívne mestečko: „Deň 1. Naše mestečko má 0 obyvateľov“ – nový účet 20 tis. sledovateľov za 3 dni.*

**Skript (30–40 s):**
1. „Toto je naše mestečko. Zatiaľ je úplne prázdne.“
2. Pravidlo: „Kto dá follow, dostane chatrč so svojím menom.“ + odmena pre prvých („obyvateľ číslo jedna“).
3. Komentáre rozhodujú: „Postavím všetko, čo napíšeš do komentárov.“
4. Cieľ série: „Keď nás bude tisíc, údolie vstúpi do doby kamennej.“
5. Otázka na komentáre: „Ako sa bude mestečko volať? Najlajkovanejší návrh vytesám do skaly.“

**Obraz:** údolie s riekou (`teren`, `rieka`, `les`, `hora`), `chatrc` s menovkami `stitok("@meno")`, počítadlo hore („DEŇ 1 · 0 obyvateľov“ cez `--nadpis` alebo 3D `text3d`). Každý diel pokračuje v tom istom svete – ulož si scénu a pridávaj.

---

## Pravidlá pre všetky formáty
- Prvé 2 sekundy rozhodujú: obraz sa hýbe od prvej snímky a háčik je vypovedaný do 2 s.
- Žiadne cudzie postavy, logá ani hudba s autorskými právami. Vlastný maskot = `postavicka(...)`.
- Fakty a čísla over. Pri príbehoch je jasné, že ide o fikciu.
- Na konci výzva len ak ju používateľ chce (napr. „Napíš do komentárov X“) – nedávaj ju automaticky.
