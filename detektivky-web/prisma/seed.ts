import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return out;
}

async function main() {
  const adminEmail = "admin@detektivky.cz";
  const adminPassword = "AdminHeslo123!";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      name: "Hlavní administrátor",
      role: "ADMIN",
    },
  });

  const detectiveCase = await prisma.case.upsert({
    where: { slug: "vrazda-na-zamku-hrabalov" },
    update: {},
    create: {
      slug: "vrazda-na-zamku-hrabalov",
      title: "Vražda na zámku Hrabalov",
      subtitle: "Fiktivní případ pro demonstraci portálu",
      teaser:
        "Hrabě je mrtev, policie případ uzavřela. Rodina najala vás. Máte 20 hodin stop, alibi a jednu šanci najít pravdu.",
      description:
        "V noci z 12. na 13. října byl ve své pracovně na zámku Hrabalov nalezen mrtvý hrabě Bedřich Hrabal. Policie případ uzavřela jako nešťastnou náhodu, ale rodina najala soukromého vyšetřovatele — vás. Prostudujte spis, vyslechněte odposlechy, pročtěte zachycené e-maily a najděte skutečného vraha.",
      difficulty: 2,
      priceCzk: 1490,
      isPublished: true,
    },
  });

  await prisma.person.deleteMany({ where: { caseId: detectiveCase.id } });
  const [victim, gardener, maid, nephew, witness] = await Promise.all([
    prisma.person.create({
      data: {
        caseId: detectiveCase.id,
        name: "Bedřich Hrabal",
        role: "VICTIM",
        occupation: "Majitel zámku",
        bio: "68 let, majitel zámku Hrabalov. Poslední dobou se s rodinou přel o dědictví.",
        address: "Zámek Hrabalov, hlavní křídlo",
        sortOrder: 0,
      },
    }),
    prisma.person.create({
      data: {
        caseId: detectiveCase.id,
        name: "Karel Novotný",
        role: "SUSPECT",
        occupation: "Zahradník",
        bio: "45 let, na zámku pracuje 20 let. Hrabě mu týden před smrtí oznámil výpověď.",
        address: "Zahradnický domek, areál zámku",
        relationship: "Bývalý zaměstnanec, dostal výpověď týden před vraždou",
        alibi: "Tvrdí, že od 19:00 hrál karty se sousedy Novákovými až do půlnoci.",
        statement:
          "Se starým pánem jsme se pohádali, to jo. Ale zabít bych ho nedokázal.",
        sortOrder: 1,
      },
    }),
    prisma.person.create({
      data: {
        caseId: detectiveCase.id,
        name: "Marie Dvořáková",
        role: "SUSPECT",
        occupation: "Komorná",
        bio: "38 let. Jako jediná měla přístup do pracovny hraběte kdykoliv. Popírá, že by tam ten večer byla.",
        address: "Pokoj pro personál, podkroví zámku",
        relationship: "Komorná, 12 let ve službě hraběte",
        alibi: "Tvrdí, že od 21:00 byla ve svém pokoji v podkroví a nikoho neviděla.",
        statement:
          "Toho večera jsem se necítila dobře, šla jsem si lehnout hned po večeři.",
        sortOrder: 2,
        isCulprit: true,
      },
    }),
    prisma.person.create({
      data: {
        caseId: detectiveCase.id,
        name: "Tomáš Hrabal",
        role: "SUSPECT",
        occupation: "Synovec, dědic",
        bio: "29 let. Podle závěti zdědí zámek. V den vraždy tvrdí, že byl v Praze.",
        address: "Praha, Vinohrady",
        relationship: "Synovec a dědic podle závěti",
        alibi: "Tvrdí, že byl ten večer v Praze na obchodní večeři, má prý svědky.",
        statement:
          "Se strýcem jsme si v poslední době nerozuměli kvůli závěti, ale stejně bych zámek jednou zdědil. Neměl jsem důvod spěchat.",
        sortOrder: 3,
      },
    }),
    prisma.person.create({
      data: {
        caseId: detectiveCase.id,
        name: "Anna Veselá",
        role: "WITNESS",
        occupation: "Kuchařka",
        bio: "52 let. Slyšela v noci hádku, ale hlasy nepoznala.",
        address: "Pokoj pro personál, přízemí",
        relationship: "Kuchařka, 15 let ve službě",
        alibi: "Byla v kuchyni a přilehlém pokoji personálu celý večer.",
        statement:
          "Kolem půl desáté jsem od pracovny slyšela hlasy, znělo to jako hádka. Pak jsem na chodbě viděla nějakou postavu, ale bylo šero.",
        sortOrder: 4,
      },
    }),
  ]);

  await prisma.document.deleteMany({ where: { caseId: detectiveCase.id } });
  await prisma.document.createMany({
    data: [
      {
        caseId: detectiveCase.id,
        title: "Policejní protokol o ohledání",
        type: "NOTE",
        content:
          "Tělo nalezeno v 6:40 ráno komorníkem. Příčina smrti: úder tupým předmětem do hlavy. Čas smrti odhadnut mezi 23:00–01:00. V pracovně chybí těžítko z hraběcího stolu.",
        sortOrder: 0,
      },
      {
        caseId: detectiveCase.id,
        title: "Výpis z deníku hraběte (poslední zápis)",
        type: "NOTE",
        content:
          "„Zítra to Marii konečně řeknu. Ví, že jsem viděl ty výpisy z účtu. Karlovi jsem dal výpověď, uvidíme, jak to přijme. Tomáš zase volal kvůli závěti — netrpělivý jako vždy.“",
        sortOrder: 1,
      },
      {
        caseId: detectiveCase.id,
        title: "Otisky prstů na těžítku",
        type: "NOTE",
        content:
          "Na náhradním těžítku (nalezeno druhý den v zahradě) byly nalezeny částečné otisky odpovídající komorné Marii Dvořákové.",
        sortOrder: 2,
      },
    ],
  });

  await prisma.wiretap.deleteMany({ where: { caseId: detectiveCase.id } });
  await prisma.wiretap.create({
    data: {
      caseId: detectiveCase.id,
      title: "Odposlech telefonátu — 12. října, 21:14",
      audioUrl: "/audio/demo-odposlech-1.mp3",
      participants: "Marie Dvořáková, neznámý muž",
      dateLabel: "12. října, 21:14",
      transcript:
        "MUŽ: Řekl ti to?\nMARIE: Ještě ne. Ale ví to. Viděl výpisy.\nMUŽ: Tak to musíš vyřešit dnes večer, jinak jsme oba v tom.\nMARIE: Já vím. Já vím.",
      sortOrder: 0,
    },
  });

  await prisma.email.deleteMany({ where: { caseId: detectiveCase.id } });
  await prisma.email.createMany({
    data: [
      {
        caseId: detectiveCase.id,
        fromPersonId: victim.id,
        toPersonId: gardener.id,
        subject: "Ukončení spolupráce",
        body: "Karle, s lítostí Vám oznamuji, že k 1. listopadu končí Váš pracovní poměr na zámku. Důvody si jistě domyslíte. B. Hrabal",
        dateLabel: "5. října",
        sortOrder: 0,
      },
      {
        caseId: detectiveCase.id,
        fromPersonId: nephew.id,
        toPersonId: victim.id,
        subject: "Re: Závěť",
        body: "Strýčku, potřebuji vědět, jak to bude se závětí. Advokát na mě tlačí. Zavolej mi prosím zpět. Tomáš",
        dateLabel: "10. října",
        sortOrder: 1,
      },
    ],
  });

  await prisma.timelineEvent.deleteMany({ where: { caseId: detectiveCase.id } });
  await prisma.timelineEvent.createMany({
    data: [
      {
        caseId: detectiveCase.id,
        timeLabel: "19:00",
        title: "Karel odchází ze zahrady",
        locationLabel: "Zahrada zámku",
        involvedLabel: "Karel Novotný",
        description: "Podle svých slov odchází domů hrát karty se sousedy.",
        sortOrder: 0,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "20:30",
        title: "Večeře v jídelně",
        locationLabel: "Jídelna",
        involvedLabel: "Bedřich Hrabal, Marie Dvořáková, Anna Veselá",
        sortOrder: 1,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "21:00",
        title: "Hrabě se uzavírá v pracovně",
        locationLabel: "Pracovna",
        involvedLabel: "Bedřich Hrabal",
        sortOrder: 2,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "21:14",
        title: "Zachycený telefonát (viz Odposlechy)",
        involvedLabel: "Marie Dvořáková, neznámý muž",
        description: "Hovor naznačuje, že se toho večera má něco „vyřešit“.",
        sortOrder: 3,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "21:45",
        title: "Anna slyší hádku od pracovny",
        locationLabel: "Kuchyň / chodba u pracovny",
        involvedLabel: "Anna Veselá (svědek)",
        sortOrder: 4,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "22:10",
        title: "Postava viděna na chodbě u pracovny",
        locationLabel: "Chodba u pracovny",
        involvedLabel: "Anna Veselá (svědek)",
        description:
          "Anna zahlédla nezřetelnou postavu — podle popisu odpovídá výšce a postavě Marie Dvořákové.",
        sortOrder: 5,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "23:00–01:00",
        title: "Odhadovaný čas smrti",
        locationLabel: "Pracovna",
        description: "Podle policejního protokolu o ohledání.",
        sortOrder: 6,
      },
      {
        caseId: detectiveCase.id,
        timeLabel: "06:40",
        title: "Tělo nalezeno komorníkem",
        locationLabel: "Pracovna",
        sortOrder: 7,
      },
    ],
  });

  // Second catalog case — lighter content, mainly to show the homepage
  // catalog with more than one card.
  const secondCase = await prisma.case.upsert({
    where: { slug: "zmizeni-v-krkonosich" },
    update: {},
    create: {
      slug: "zmizeni-v-krkonosich",
      title: "Zmizení v Krkonoších",
      subtitle: "Fiktivní případ pro demonstraci portálu",
      teaser:
        "Zkušený horský vůdce zmizel beze stopy na túře, kterou vedl už stokrát. Jeho telefon našli o den později — v jiném pohoří.",
      description:
        "Horský vůdce Petr Šindelář se během vedené túry ztratil beze stopy. Jeho skupina tvrdí, že jim v mlze zmizel z dohledu. O den později se jeho telefon objevil v odpadkovém koši na vlakovém nádraží ve zcela jiném kraji. Zmizel dobrovolně, nebo se stal obětí?",
      difficulty: 3,
      priceCzk: 1690,
      isPublished: true,
    },
  });

  await prisma.person.deleteMany({ where: { caseId: secondCase.id } });
  await prisma.person.createMany({
    data: [
      {
        caseId: secondCase.id,
        name: "Petr Šindelář",
        role: "VICTIM",
        occupation: "Horský vůdce",
        bio: "41 let, vedl túry v Krkonoších přes 15 let. Poslední dobou měl finanční potíže.",
        sortOrder: 0,
      },
      {
        caseId: secondCase.id,
        name: "Jana Malá",
        role: "WITNESS",
        occupation: "Účastnice túry",
        bio: "34 let. Jako poslední s Petrem mluvila těsně předtím, než zmizel v mlze.",
        sortOrder: 1,
      },
    ],
  });

  await prisma.document.deleteMany({ where: { caseId: secondCase.id } });
  await prisma.document.create({
    data: {
      caseId: secondCase.id,
      title: "Hlášení o pohřešované osobě",
      type: "NOTE",
      content:
        "Petr Šindelář nahlášen jako pohřešovaný 14. srpna v 18:20. Poslední kontakt s klienty proběhl kolem 15:00 v oblasti Sněžky.",
      sortOrder: 0,
    },
  });

  await prisma.box.deleteMany({ where: { customerLabel: "Demo objednávka" } });
  const boxCode = `DET-${randomCode(4)}-${randomCode(4)}`;
  const boxPassword = `${randomCode(5)}-${randomCode(5)}-${randomCode(5)}`;
  await prisma.box.create({
    data: {
      code: boxCode,
      passwordHash: await bcrypt.hash(boxPassword, 12),
      caseId: detectiveCase.id,
      customerLabel: "Demo objednávka",
    },
  });

  console.log("\nSeed hotov.\n");
  console.log("Admin  →", adminEmail, "/", adminPassword);
  console.log("Box    →", boxCode, "/", boxPassword);
  console.log(`Pachatel (pro testování): ${maid.name}\n`);
  void witness;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
