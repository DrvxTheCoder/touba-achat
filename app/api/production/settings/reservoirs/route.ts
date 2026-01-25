import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ReservoirType } from '@prisma/client';

// Schema validation
const reservoirConfigSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.nativeEnum(ReservoirType),
  capacity: z.number().positive('La capacité doit être positive'),
  calculationMode: z.enum(['AUTOMATIC', 'MANUAL']).optional().default('AUTOMATIC'),
  productionCenterId: z.number().int().positive(),
});

// GET /api/production/settings/reservoirs - List all reservoir configurations
// Supports optional filtering by productionCenterId
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const centerId = searchParams.get('centerId');

    const where = centerId ? { productionCenterId: parseInt(centerId) } : {};

    const reservoirs = await prisma.reservoirConfig.findMany({
      where,
      include: {
        productionCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            reservoirs: true,
          },
        },
      },
      orderBy: [
        { productionCenter: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(reservoirs);
  } catch (error: any) {
    console.error('Erreur récupération configurations de réservoirs:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/production/settings/reservoirs - Create a new reservoir configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    console.log('📥 Received body:', body);

    const validated = reservoirConfigSchema.parse(body);
    console.log('✅ Validated data:', validated);

    // Check if production center exists
    const center = await prisma.productionCenter.findUnique({
      where: { id: validated.productionCenterId },
    });

    if (!center) {
      return NextResponse.json(
        { error: 'Centre de production introuvable' },
        { status: 404 }
      );
    }

    console.log('🏭 Creating reservoir with data:', validated);
    const reservoir = await prisma.reservoirConfig.create({
      data: validated,
      include: {
        productionCenter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(reservoir);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('❌ Erreur création configuration de réservoir:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/production/settings/reservoirs - Update a reservoir configuration
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const validated = reservoirConfigSchema.partial().parse(data);

    // If updating production center, check if it exists
    if (validated.productionCenterId) {
      const center = await prisma.productionCenter.findUnique({
        where: { id: validated.productionCenterId },
      });

      if (!center) {
        return NextResponse.json(
          { error: 'Centre de production introuvable' },
          { status: 404 }
        );
      }
    }

    const reservoir = await prisma.reservoirConfig.update({
      where: { id },
      data: validated,
      include: {
        productionCenter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(reservoir);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur mise à jour configuration de réservoir:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/production/settings/reservoirs?id=123 - Delete a reservoir configuration
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Check if reservoir config has been used in inventories
    const reservoir = await prisma.reservoirConfig.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { reservoirs: true },
        },
      },
    });

    if (!reservoir) {
      return NextResponse.json(
        { error: 'Configuration de réservoir introuvable' },
        { status: 404 }
      );
    }

    if (reservoir._count.reservoirs > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un réservoir utilisé dans des inventaires' },
        { status: 400 }
      );
    }

    await prisma.reservoirConfig.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression configuration de réservoir:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
