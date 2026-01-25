// app/api/production/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!session.user.access?.includes('VIEW_PRODUCTION_DASHBOARD')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week';

    // Calcul des dates selon la période
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'semester':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Journée d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInventory = await prisma.productionInventory.findFirst({
      where: { date: today },
      include: {
        _count: { select: { arrets: true } }
      }
    });

    // Journée d'hier
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayInventory = await prisma.productionInventory.findFirst({
      where: { date: yesterday, status: 'TERMINE' }
    });

    // Statistiques de la période
    const periodInventories = await prisma.productionInventory.findMany({
      where: {
        date: { gte: startDate, lte: now },
        status: 'TERMINE'
      },
      orderBy: { date: 'asc' }
    });

    // Calcul des moyennes
    const count = periodInventories.length;
    const stats = periodInventories.reduce(
      (acc, inv) => ({
        avgStockInitial: acc.avgStockInitial + (inv.stockInitialPhysique || 0),
        avgStockFinal: acc.avgStockFinal + (inv.stockFinalPhysique || 0),
        avgCumulSortie: acc.avgCumulSortie + (inv.cumulSortie || 0),
        avgEcart: acc.avgEcart + (inv.ecart || 0),
        avgRendement: acc.avgRendement + (inv.rendement || 0),
        totalBottles: acc.totalBottles + (inv.totalBottlesProduced || 0)
      }),
      {
        avgStockInitial: 0,
        avgStockFinal: 0,
        avgCumulSortie: 0,
        avgEcart: 0,
        avgRendement: 0,
        totalBottles: 0
      }
    );

    const periodStats = count > 0
      ? {
          avgStockInitial: stats.avgStockInitial / count,
          avgStockFinal: stats.avgStockFinal / count,
          avgCumulSortie: stats.avgCumulSortie / count,
          avgEcart: stats.avgEcart / count,
          avgRendement: stats.avgRendement / count,
          totalBottles: stats.totalBottles
        }
      : {
          avgStockInitial: 0,
          avgStockFinal: 0,
          avgCumulSortie: 0,
          avgEcart: 0,
          avgRendement: 0,
          totalBottles: 0
        };

    // Données pour les graphiques
    const charts = {
      stocks: periodInventories.map((inv) => ({
        date: new Date(inv.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit'
        }),
        stockFinal: inv.stockFinalPhysique || 0,
        ecart: inv.ecart || 0
      })),
      production: periodInventories.map((inv) => ({
        date: new Date(inv.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit'
        }),
        bottles: inv.totalBottlesProduced || 0,
        cumulSortie: inv.cumulSortie || 0
      }))
    };

    return NextResponse.json({
      today: todayInventory,
      yesterday: yesterdayInventory,
      period: periodStats,
      charts
    });
  } catch (error) {
    console.error('Erreur récupération dashboard:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}