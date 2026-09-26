import type Database from "better-sqlite3";

/** Vloží výchozí rubriky, nastavení a několik ukázkových článků, pokud je databáze prázdná. */
export function seedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) AS c FROM categories").get() as { c: number };
  if (count.c > 0) return;

  const insertCat = db.prepare("INSERT INTO categories (name, slug, description, position) VALUES (?, ?, ?, ?)");
  const cats = [
    ["Domov", "domov", "Zprávy a dění v Česku", 1],
    ["Svět", "svet", "Zahraniční zpravodajství", 2],
    ["Ekonomika", "ekonomika", "Byznys, trhy a peníze", 3],
    ["Technologie", "technologie", "Digitální svět a inovace", 4],
    ["Kultura", "kultura", "Film, hudba, literatura", 5],
    ["Komentáře", "komentare", "Názory a analýzy", 6],
  ] as const;
  const catIds: Record<string, number> = {};
  for (const [name, slug, desc, pos] of cats) {
    const r = insertCat.run(name, slug, desc, pos);
    catIds[slug] = Number(r.lastInsertRowid);
  }

  const setSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  setSetting.run("site_name", "MJ media");
  setSetting.run("tagline", "Nezávislé médium. Články, které dávají smysl.");
  setSetting.run("author_name", "MJ");
  setSetting.run("about", "MJ media je nezávislý online prostor pro články, analýzy a komentáře. Píšeme přehledně, bez balastu a s důrazem na kontext.");
  setSetting.run("footer_note", "© MJ media. Všechna práva vyhrazena.");
  setSetting.run("contact_email", "");
  setSetting.run("social_x", "");
  setSetting.run("social_instagram", "");
  setSetting.run("social_facebook", "");

  const insertArt = db.prepare(`
    INSERT INTO articles (title, slug, perex, content, cover_image, cover_caption, category_id, author, status, featured, published_at)
    VALUES (@title, @slug, @perex, @content, @cover_image, @cover_caption, @category_id, @author, 'published', @featured, @published_at)
  `);
  const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)");
  const getTag = db.prepare("SELECT id FROM tags WHERE slug = ?");
  const link = db.prepare("INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)");

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

  const body = (intro: string) => `${intro}

## Co se stalo

Tento text je ukázkový. Slouží k tomu, abyste viděli, jak vypadá typografie článku, mezititulky, citace a seznamy. V administraci ho můžete kdykoli upravit nebo smazat.

> „Dobrá novinařina není o rychlosti, ale o kontextu.“ — redakce MJ media

## Proč na tom záleží

- První důvod, který vysvětluje souvislosti.
- Druhý důvod, který ukazuje dopad na čtenáře.
- Třetí důvod, který naznačuje, co bude dál.

Text pokračuje dalším odstavcem. Odstavce oddělujte prázdným řádkem, **tučné** a *kurzívu* píšete stejně jako v Markdownu. Odkazy vypadají takto: [MJ media](/).

### Co bude dál

Závěrečný odstavec shrnuje hlavní myšlenku a naznačuje, na co se zaměříme v dalším textu.`;

  const sample = [
    {
      title: "Vítejte v MJ media: nový prostor pro články, které dávají smysl",
      slug: "vitejte-v-mj-media",
      perex: "Spouštíme nezávislé médium. Přehledně, bez balastu a s důrazem na kontext. Tady je, co od nás můžete čekat.",
      content: body("MJ media vzniká jako místo, kde se dá číst v klidu. Žádné vyskakovací okna, žádné titulky psané pro kliknutí. Jen texty, které mají hlavu a patu."),
      cover_image: "/samples/cover-1.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["komentare"], author: "MJ", featured: 1, published_at: hoursAgo(3), tags: ["Redakce", "Úvodník"],
    },
    {
      title: "Jak číst ekonomická data, aniž byste se ztratili v grafech",
      slug: "jak-cist-ekonomicka-data",
      perex: "Inflace, HDP, sazby. Tři čísla, která hýbou titulky. Vysvětlujeme, co skutečně znamenají pro vaši peněženku.",
      content: body("Každý měsíc přicházejí nová makroekonomická čísla a s nimi i vlna zjednodušených titulků. Zkusíme se na ně podívat bez paniky."),
      cover_image: "/samples/cover-2.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["ekonomika"], author: "MJ", featured: 0, published_at: hoursAgo(8), tags: ["Inflace", "Vysvětlujeme"],
    },
    {
      title: "Umělá inteligence v redakcích: pomocník, nebo náhrada?",
      slug: "umela-inteligence-v-redakcich",
      perex: "Nástroje generativní AI mění, jak vznikají texty. Ptáme se, kde je hranice mezi užitečnou pomocí a ztrátou důvěry.",
      content: body("Redakce po celém světě testují nástroje, které umí navrhnout titulek, shrnout dokument nebo přepsat rozhovor. Otázka zní, co s tím udělá čtenářská důvěra."),
      cover_image: "/samples/cover-3.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["technologie"], author: "MJ", featured: 0, published_at: hoursAgo(20), tags: ["AI", "Média"],
    },
    {
      title: "Praha chystá nový plán pro centrum. Co se změní pro chodce",
      slug: "praha-novy-plan-pro-centrum",
      perex: "Méně aut, více stromů a širší chodníky. Podíváme se na to, co návrh obsahuje a kde narazí na odpor.",
      content: body("Magistrát představil koncept, který má během deseti let proměnit historické jádro. Klíčové jsou tři body: doprava, zeleň a veřejný prostor."),
      cover_image: "/samples/cover-4.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["domov"], author: "MJ", featured: 0, published_at: hoursAgo(30), tags: ["Praha", "Doprava"],
    },
    {
      title: "Evropa hledá odpověď na energetickou závislost. Tři scénáře pro příští zimu",
      slug: "evropa-energeticka-zavislost-scenare",
      perex: "Zásobníky jsou plné, ceny klidnější. Přesto zůstává několik otazníků, které mohou situaci rychle změnit.",
      content: body("Po dvou napjatých zimách vstupuje Evropa do topné sezony s rekordně naplněnými zásobníky. Analytici přesto varují před přílišným optimismem."),
      cover_image: "/samples/cover-5.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["svet"], author: "MJ", featured: 0, published_at: hoursAgo(48), tags: ["Energetika", "EU"],
    },
    {
      title: "Nový český film boduje na festivalech. Proč o něm doma skoro nikdo neví",
      slug: "novy-cesky-film-festivaly",
      perex: "Zahraniční kritika ho chválí, domácí distribuce váhá. Příběh snímku, který ukazuje slabiny českého kina.",
      content: body("Snímek získal ocenění na dvou evropských festivalech, ale česká kina ho zatím uvedla jen v několika kopiích. Zajímalo nás proč."),
      cover_image: "/samples/cover-6.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["kultura"], author: "MJ", featured: 0, published_at: hoursAgo(70), tags: ["Film"],
    },
    {
      title: "Komentář: Proč potřebujeme pomalejší zprávy",
      slug: "komentar-pomalejsi-zpravy",
      perex: "Rychlost se stala měřítkem kvality. Jenže čtenář nepotřebuje vědět všechno hned, potřebuje vědět, co je důležité.",
      content: body("Zpravodajský cyklus se zkrátil na minuty. Otázka je, jestli je to pro čtenáře výhra, nebo ztráta."),
      cover_image: "", cover_caption: "",
      category_id: catIds["komentare"], author: "MJ", featured: 0, published_at: hoursAgo(96), tags: ["Média", "Úvodník"],
    },
    {
      title: "Sněmovna schválila rozpočet. Pět věcí, které se od ledna změní",
      slug: "snemovna-schvalila-rozpocet",
      perex: "Daně, důchody, školství. Prošli jsme stovky stran a vybrali to, co se dotkne většiny domácností.",
      content: body("Rozpočet na příští rok prošel po dvoudenní debatě. Většina změn je technická, několik jich ale pocítí každý."),
      cover_image: "/samples/cover-3.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["domov"], author: "MJ", featured: 0, published_at: hoursAgo(14), tags: ["Rozpočet", "Vysvětlujeme"],
    },
    {
      title: "Koruna posílila na dvouleté maximum. Co to znamená pro dovolenou i hypotéky",
      slug: "koruna-posilila-na-maximum",
      perex: "Silnější měna zlevňuje cesty do zahraničí, ale komplikuje život exportérům. Přehled dopadů v pěti bodech.",
      content: body("Česká koruna během týdne posílila k euru nejvíc za poslední dva roky. Ptali jsme se, kdo na tom vydělá a kdo prodělá."),
      cover_image: "/samples/cover-6.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["ekonomika"], author: "MJ", featured: 0, published_at: hoursAgo(26), tags: ["Koruna", "Hypotéky"],
    },
    {
      title: "Volby v sousedním Německu: tři scénáře, které rozhodnou o Evropě",
      slug: "volby-v-nemecku-scenare",
      perex: "Berlín volí a Praha sleduje. Výsledek ovlivní energetiku, automobilky i pozici Česka v Unii.",
      content: body("Německé volby bývají evropskou událostí. Letos to platí dvojnásob, protože tři možné koalice znamenají tři různé směry."),
      cover_image: "/samples/cover-1.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["svet"], author: "MJ", featured: 0, published_at: hoursAgo(55), tags: ["Německo", "EU"],
    },
    {
      title: "Ověřili jsme: pět nejčastějších mýtů o elektromobilech",
      slug: "myty-o-elektromobilech",
      perex: "Baterie po třech letech odejde, v zimě nedojedete, nabíjení trvá hodiny. Podívali jsme se na data.",
      content: body("Elektromobily budí vášně. Vybrali jsme pět tvrzení, která se objevují nejčastěji, a porovnali je s dostupnými čísly."),
      cover_image: "/samples/cover-4.svg", cover_caption: "Ilustrace: MJ media",
      category_id: catIds["technologie"], author: "MJ", featured: 0, published_at: hoursAgo(40), tags: ["Elektromobily", "Ověřujeme"],
    },
    {
      title: "Komentář: Média nepotřebují víc obsahu, ale víc důvěry",
      slug: "komentar-media-a-duvera",
      perex: "Každý den vzniká víc textů než kdy dřív. Čtenář ale nehledá kvantitu, hledá někoho, komu může věřit.",
      content: body("Když se mluví o krizi médií, obvykle se myslí peníze. Ta skutečná krize je ale jinde: v důvěře."),
      cover_image: "", cover_caption: "",
      category_id: catIds["komentare"], author: "MJ", featured: 0, published_at: hoursAgo(120), tags: ["Média"],
    },
    {
      title: "Koncept: Rozpracovaný článek (ukázka)",
      slug: "koncept-ukazka",
      perex: "Tento článek je uložen jako koncept a na webu se nezobrazuje.",
      content: "Rozepsaný text, který ještě není hotový.",
      cover_image: "", cover_caption: "",
      category_id: catIds["domov"], author: "MJ", featured: 0, published_at: null, tags: [],
    },
  ];

  const tx = db.transaction(() => {
    for (const a of sample) {
      const { tags, ...row } = a;
      const r = insertArt.run(row);
      if (a.published_at === null) db.prepare("UPDATE articles SET status='draft' WHERE id=?").run(r.lastInsertRowid);
      for (const t of tags) {
        const slug = t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
        insertTag.run(t, slug);
        const tag = getTag.get(slug) as { id: number };
        link.run(r.lastInsertRowid, tag.id);
      }
    }
  });
  tx();
}
