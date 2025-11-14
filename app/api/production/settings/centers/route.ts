import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation
const productionCenterSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  chefProductionId: z.number().int().positive(),
});

// GET /api/production/settings/centers - List all production centers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const centers = await prisma.productionCenter.findMany({
      include: {
        chefProduction: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reservoirs: {
          select: {
            id: true,
            name: true,
            type: true,
            capacity: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            inventories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(centers);
  } catch (error: any) {
    console.error('Erreur récupération centres de production:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/production/settings/centers - Create a new production center
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN' && !session.user.access.includes('IT_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const validated = productionCenterSchema.parse(body);

    // Check if chef exists and has production access
    const chef = await prisma.user.findUnique({
      where: { id: validated.chefProductionId },
    });

    if (!chef) {
      return NextResponse.json(
        { error: 'Chef de production introuvable' },
        { status: 404 }
      );
    }

    if (!chef.access.includes('CREATE_PRODUCTION_INVENTORY')) {
      return NextResponse.json(
        { error: 'L\'utilisateur n\'a pas les droits de production' },
        { status: 400 }
      );
    }

    const center = await prisma.productionCenter.create({
      data: validated,
      include: {
        chefProduction: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(center);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur création centre de production:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/production/settings/centers - Update a production center
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN' && !session.user.access.includes('IT_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const validated = productionCenterSchema.partial().parse(data);

    // If updating chef, check if user has production access
    if (validated.chefProductionId) {
      const chef = await prisma.user.findUnique({
        where: { id: validated.chefProductionId },
      });

      if (!chef) {
        return NextResponse.json(
          { error: 'Chef de production introuvable' },
          { status: 404 }
        );
      }

      if (!chef.access.includes('CREATE_PRODUCTION_INVENTORY')) {
        return NextResponse.json(
          { error: 'L\'utilisateur n\'a pas les droits de production' },
          { status: 400 }
        );
      }
    }

    const center = await prisma.productionCenter.update({
      where: { id },
      data: validated,
      include: {
        chefProduction: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(center);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur mise à jour centre de production:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/production/settings/centers?id=123 - Delete a production center
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN' && !session.user.access.includes('IT_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Check if center has inventories
    const center = await prisma.productionCenter.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { inventories: true },
        },
      },
    });

    if (!center) {
      return NextResponse.json(
        { error: 'Centre introuvable' },
        { status: 404 }
      );
    }

    if (center._count.inventories > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un centre avec des inventaires' },
        { status: 400 }
      );
    }

    await prisma.productionCenter.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression centre de production:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
