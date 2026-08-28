const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const sections = [
    'Biciklistička',
    'Disco',
    'Dramska',
    'Foto',
    'Glazbena',
    'Media',
    'Planinarska',
    'Računarska',
    'Tehnička',
    'Video',
  ];
  for (const name of sections) {
    await prisma.section.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${sections.length} sections`);


  const teams = ['Kulinarski', 'Projektni', 'Program'];
  for (const name of teams) {
    await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${teams.length} teams`);


  const allergies = [
    'Gluten',
    'Laktoza',
    'Kikiriki',
  ];
  for (const name of allergies) {
    await prisma.allergy.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${allergies.length} allergies`);


  const drinks = ['Voda', 'Pivo', 'Sok', 'Kava'];
  for (const name of drinks) {
    await prisma.drink.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${drinks.length} drinks`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
