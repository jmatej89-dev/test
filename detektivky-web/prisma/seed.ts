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
      description:
        "V noci z 12. na 13. října byl ve své pracovně na zámku Hrabalov nalezen mrtvý hrabě Bedřich Hrabal. Policie případ uzavřela jako nešťastnou náhodu, ale rodina najala soukromého vyšetřovatele — vás. Prostudujte spis, vyslechněte odposlechy, pročtěte zachycené e-maily a najděte skutečného vraha.",
      difficulty: 2,
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
