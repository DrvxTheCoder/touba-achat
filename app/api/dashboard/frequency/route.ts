// app/api/dashboard/frequency/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id, 10) : session.user.id;
    
    // Get user's employee ID
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      select: { employee: { select: { id: true } } }
    });
    
    const employeeId = employee?.employee?.id;

    // Get the date 6 months ago from now
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // -5 to include current month
    sixMonthsAgo.setDate(1); // Start of month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Function to get month data
    const getMonthData = async (date: Date) => {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [stockEdbs, standardEdbs, odms] = await Promise.all([
        // Stock EDBs count
        prisma.stockEtatDeBesoin.count({
          where: {
            employeeId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        // Standard EDBs count
        prisma.etatDeBesoin.count({
          where: {
            creatorId: employeeId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
        // ODMs count
        prisma.ordreDeMission.count({
          where: {
            creatorId: employeeId,
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        }),
      ]);

      return {
        month: startOfMonth.toLocaleString('fr-FR', { month: 'long' }),
        stockEdb: stockEdbs,
        standardEdb: standardEdbs,
        odm: odms,
      };
    };

    // Get data for last 6 months
    const monthsData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthData = await getMonthData(monthDate);
      monthsData.unshift(monthData); // Add to start of array to maintain chronological order
    }

    return NextResponse.json(monthsData);
    
  } catch (error) {
    console.error('Error fetching frequency metrics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    );
  }
}