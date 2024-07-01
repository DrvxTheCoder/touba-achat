import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { name: 'Direction Generale' },
    { name: 'Direction Ressources Humaines' },
    { name: 'Direction Commerciale Marketing' },
    { name: 'Direction Administrative et Financière' },
    { name: 'Direction Opération Gaz' },
    { name: 'Touba Gaz Bouteille' },
    { name: 'Holding' },
    { name: 'Touba Oil Carburant' },
    { name: 'Darou Khoudoss Gaz' },
    { name: 'Darou Khoudoss Oil' },
    { name: 'Prestataire' },
    { name: 'NSIA Banque' },
    { name: 'Connect\'Interim' },
    { name: 'AMD Corporation' },
    { name: 'Service Transit' },
    { name: 'Baity Group SA' },
    { name: 'Elite RH' },
  ];

  for (const department of departments) {
    await prisma.department.create({
      data: department,
    });
  }

  console.log('Departments have been created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
