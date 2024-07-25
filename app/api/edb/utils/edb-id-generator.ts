import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function generateEDBId(): Promise<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

  const latestEDB = await prisma.etatDeBesoin.findFirst({
    where: { edbId: { startsWith: `EDB-${currentYear}${currentMonth}` } },
    orderBy: { id: 'desc' },
    select: { edbId: true },
  });

  let latestNumber = 0;
  if (latestEDB) {
    const parts = latestEDB.edbId.split('-');
    if (parts.length === 4) {
      const parsedNumber = parseInt(parts[3], 10);
      if (!isNaN(parsedNumber)) {
        latestNumber = parsedNumber;
      }
    }
  }

  const newNumber = latestNumber + 1;
  return `EDB-${currentYear}${currentMonth}-${newNumber.toString().padStart(4, '0')}`;
}