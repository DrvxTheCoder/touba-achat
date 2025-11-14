import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { BottleType } from '@prisma/client';

// Schema validation
const bottleTypeSchema = z.object({
  type: z.nativeEnum(BottleType),
  weight: z.number().positive(),
  name: z.string().min(1),
});

// GET /api/production/settings/bottle-types - List all bottle type configurations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const bottleTypes = await prisma.bottleTypeConfig.findMany({
      orderBy: { weight: 'asc' },
    });

    return NextResponse.json(bottleTypes);
  } catch (error: any) {
    console.error('Erreur récupération types de bouteilles:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/production/settings/bottle-types - Create a new bottle type configuration
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
    const validated = bottleTypeSchema.parse(body);

    const bottleType = await prisma.bottleTypeConfig.create({
      data: validated,
    });

    return NextResponse.json(bottleType);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur création type de bouteille:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/production/settings/bottle-types - Update a bottle type configuration
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

    const validated = bottleTypeSchema.partial().parse(data);

    const bottleType = await prisma.bottleTypeConfig.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json(bottleType);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur mise à jour type de bouteille:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/production/settings/bottle-types?id=123 - Delete a bottle type configuration
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

    await prisma.bottleTypeConfig.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression type de bouteille:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
