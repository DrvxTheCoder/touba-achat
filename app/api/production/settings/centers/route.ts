import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema validation - now supports multiple chefs
const productionCenterSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  address: z.string().min(1, 'L\'adresse est requise'),
  chefProductionIds: z.array(z.number().int().positive()).min(1, 'Au moins un chef de production est requis'),
});

// Helper to transform center data to include chefProduction for backward compatibility
function transformCenterResponse(center: any) {
  const chefs = center.chefProductions?.map((cp: any) => cp.user) || [];
  return {
    ...center,
    // Keep chefProduction as the first chef for backward compatibility
    chefProduction: chefs[0] || null,
    // Add new field with all chefs
    chefProductions: chefs,
  };
}

// GET /api/production/settings/centers - List all production centers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const centers = await prisma.productionCenter.findMany({
      include: {
        chefProductions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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

    // Transform to include backward-compatible chefProduction field
    const transformedCenters = centers.map(transformCenterResponse);

    return NextResponse.json(transformedCenters);
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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();

    // Handle backward compatibility: if chefProductionId is provided, convert to array
    if (body.chefProductionId && !body.chefProductionIds) {
      body.chefProductionIds = [body.chefProductionId];
    }

    const validated = productionCenterSchema.parse(body);

    // Check if all chefs exist and have production access
    const chefs = await prisma.user.findMany({
      where: { id: { in: validated.chefProductionIds } },
    });

    if (chefs.length !== validated.chefProductionIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs chefs de production introuvables' },
        { status: 404 }
      );
    }

    const chefsWithoutAccess = chefs.filter(
      chef => !chef.access.includes('CREATE_PRODUCTION_INVENTORY')
    );

    if (chefsWithoutAccess.length > 0) {
      return NextResponse.json(
        { error: `Les utilisateurs suivants n'ont pas les droits de production: ${chefsWithoutAccess.map(c => c.name).join(', ')}` },
        { status: 400 }
      );
    }

    const center = await prisma.productionCenter.create({
      data: {
        name: validated.name,
        address: validated.address,
        chefProductions: {
          create: validated.chefProductionIds.map(userId => ({
            userId,
          })),
        },
      },
      include: {
        chefProductions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(transformCenterResponse(center));
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
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Handle backward compatibility: if chefProductionId is provided, convert to array
    if (data.chefProductionId && !data.chefProductionIds) {
      data.chefProductionIds = [data.chefProductionId];
    }

    const validated = productionCenterSchema.partial().parse(data);

    // If updating chefs, check if all users have production access
    if (validated.chefProductionIds && validated.chefProductionIds.length > 0) {
      const chefs = await prisma.user.findMany({
        where: { id: { in: validated.chefProductionIds } },
      });

      if (chefs.length !== validated.chefProductionIds.length) {
        return NextResponse.json(
          { error: 'Un ou plusieurs chefs de production introuvables' },
          { status: 404 }
        );
      }

      const chefsWithoutAccess = chefs.filter(
        chef => !chef.access.includes('CREATE_PRODUCTION_INVENTORY')
      );

      if (chefsWithoutAccess.length > 0) {
        return NextResponse.json(
          { error: `Les utilisateurs suivants n'ont pas les droits de production: ${chefsWithoutAccess.map(c => c.name).join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.address) updateData.address = validated.address;

    // Update center and chefs in a transaction
    const center = await prisma.$transaction(async (tx) => {
      // If chefs are being updated, delete existing and create new
      if (validated.chefProductionIds && validated.chefProductionIds.length > 0) {
        await tx.productionCenterChef.deleteMany({
          where: { productionCenterId: id },
        });

        await tx.productionCenterChef.createMany({
          data: validated.chefProductionIds.map(userId => ({
            productionCenterId: id,
            userId,
          })),
        });
      }

      // Update center basic info
      return tx.productionCenter.update({
        where: { id },
        data: updateData,
        include: {
          chefProductions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(transformCenterResponse(center));
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
    if (session.user.role !== 'ADMIN') {
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
