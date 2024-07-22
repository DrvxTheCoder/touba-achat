import { PrismaClient, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default async function generateEDBId() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0'); // +1 because getMonth() returns 0-11
  
    const latestEDB = await prisma.etatDeBesoin.findFirst({
      where: { edbId: { startsWith: `EDB-${currentYear}-${currentMonth}-` } },
      orderBy: { id: 'desc' },
      select: { edbId: true },
    });
  
    const latestNumber = latestEDB 
      ? parseInt(latestEDB.edbId.split('-')[3]) 
      : 0;
  
    return `EDB-${currentYear}${currentMonth}${(latestNumber + 1).toString().padStart(4, '0')}`;
  }
 // e.g., EDB-2023-07-0001