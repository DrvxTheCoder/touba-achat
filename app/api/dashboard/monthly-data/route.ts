import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { Prisma } from '@prisma/client';

type MonthlyCount = {
  month: number;
  count: number;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

    if (!entity || (entity !== 'edb' && entity !== 'odm')) {
      return NextResponse.json({ error: 'Paramètre d\'entité invalide' }, { status: 400 });
    }

    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year + 1, 0, 1));

    let rawData: MonthlyCount[];
    if (entity === 'edb') {
      rawData = await prisma.$queryRaw<MonthlyCount[]>`
        SELECT EXTRACT(MONTH FROM "createdAt") as month, COUNT(*) as count
        FROM "EtatDeBesoin"
        WHERE "createdAt" >= ${startDate} AND "createdAt" < ${endDate}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY month
      `;
    } else {
      rawData = await prisma.$queryRaw<MonthlyCount[]>`
        SELECT EXTRACT(MONTH FROM "createdAt") as month, COUNT(*) as count
        FROM "OrdreDeMission"
        WHERE "createdAt" >= ${startDate} AND "createdAt" < ${endDate}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY month
      `;
    }

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const formattedData = monthNames.map((monthName, index) => {
      const monthData = rawData.find(item => item.month === index + 1);
      return {
        month: monthName,
        [entity + 's']: monthData ? Number(monthData.count) : 0
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching monthly counts:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}