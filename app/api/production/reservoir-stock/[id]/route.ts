import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

// GET /api/production/reservoir-stock/[id] - Get current stock for a specific reservoir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const reservoirConfigId = parseInt(params.id);

    // Get reservoir config
    const reservoirConfig = await prisma.reservoirConfig.findUnique({
      where: { id: reservoirConfigId },
      include: {
        productionCenter: true,
      },
    });

    if (!reservoirConfig) {
      return NextResponse.json(
        { error: 'Configuration de réservoir introuvable' },
        { status: 404 }
      );
    }

    // Get latest completed inventory for this production center
    const latestInventory = await prisma.productionInventory.findFirst({
      where: {
        productionCenterId: reservoirConfig.productionCenterId,
        status: 'TERMINE',
      },
      include: {
        reservoirs: {
          where: {
            reservoirConfigId: reservoirConfigId,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    if (!latestInventory || latestInventory.reservoirs.length === 0) {
      return NextResponse.json(
        {
          reservoirName: reservoirConfig.name,
          reservoirType: reservoirConfig.type,
          capacity: reservoirConfig.capacity,
          stockActuel: 0,
          pourcentageRemplissage: 0,
          derniereMAJ: new Date().toISOString(),
        }
      );
    }

    const reservoir = latestInventory.reservoirs[0];
    const stockActuel = reservoir.poidsLiquide || 0;
    const capacityInTonnes = reservoirConfig.capacity * 0.51; // Convert m³ to tonnes
    const pourcentageRemplissage = capacityInTonnes > 0
      ? (stockActuel / capacityInTonnes) * 100
      : 0;

    return NextResponse.json({
      reservoirName: reservoirConfig.name,
      reservoirType: reservoirConfig.type,
      capacity: reservoirConfig.capacity,
      stockActuel,
      pourcentageRemplissage,
      derniereMAJ: latestInventory.completedAt?.toISOString() || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erreur récupération stock réservoir:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
