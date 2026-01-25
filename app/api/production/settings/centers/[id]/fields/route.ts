import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

interface FieldConfig {
  id?: number;
  name: string;
  label: string;
  order: number;
  isActive: boolean;
  isRequired: boolean;
}

// GET /api/production/settings/centers/[id]/fields - Get field configurations
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const centerId = parseInt(params.id);

    const [approFields, sortieFields] = await Promise.all([
      prisma.approFieldConfig.findMany({
        where: { productionCenterId: centerId, isActive: true },
        orderBy: { order: 'asc' },
      }),
      prisma.sortieFieldConfig.findMany({
        where: { productionCenterId: centerId, isActive: true },
        orderBy: { order: 'asc' },
      }),
    ]);

    return NextResponse.json({
      appro: approFields,
      sortie: sortieFields,
    });
  } catch (error: any) {
    console.error('Error fetching fields:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!session.user.access?.includes('VALIDATE_PRODUCTION_INVENTORY')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const centerId = parseInt(params.id);
    const { approFields, sortieFields } = await req.json() as {
      approFields: FieldConfig[];
      sortieFields: FieldConfig[];
    };

    // Validate all fields have name and label
    const invalidAppro = approFields.some(f => !f.name || !f.label);
    const invalidSortie = sortieFields.some(f => !f.name || !f.label);

    if (invalidAppro || invalidSortie) {
      return NextResponse.json(
        { error: 'Tous les champs doivent avoir un nom et un label' },
        { status: 400 }
      );
    }

    // Use a transaction to update all fields atomically
    await prisma.$transaction(async (tx) => {
      // Get existing field configurations
      const existingAppro = await tx.approFieldConfig.findMany({
        where: { productionCenterId: centerId },
      });

      const existingSortie = await tx.sortieFieldConfig.findMany({
        where: { productionCenterId: centerId },
      });

      // Process Appro Fields
      for (const field of approFields) {
        if (field.id) {
          // Update existing field
          await tx.approFieldConfig.update({
            where: { id: field.id },
            data: {
              name: field.name,
              label: field.label,
              order: field.order,
              isActive: field.isActive,
              isRequired: field.isRequired,
            },
          });
        } else {
          // Create new field
          await tx.approFieldConfig.create({
            data: {
              productionCenterId: centerId,
              name: field.name,
              label: field.label,
              order: field.order,
              isActive: field.isActive,
              isRequired: field.isRequired,
            },
          });
        }
      }

      // Delete approFields that were removed (not in the new list)
      const approFieldIds = approFields.filter(f => f.id).map(f => f.id!);
      const fieldsToDelete = existingAppro.filter(f => !approFieldIds.includes(f.id));

      for (const field of fieldsToDelete) {
        // Check if field has any values
        const valueCount = await tx.approValue.count({
          where: { fieldConfigId: field.id },
        });

        if (valueCount > 0) {
          // Don't delete, just deactivate
          await tx.approFieldConfig.update({
            where: { id: field.id },
            data: { isActive: false },
          });
        } else {
          // Safe to delete
          await tx.approFieldConfig.delete({
            where: { id: field.id },
          });
        }
      }

      // Process Sortie Fields
      for (const field of sortieFields) {
        if (field.id) {
          // Update existing field
          await tx.sortieFieldConfig.update({
            where: { id: field.id },
            data: {
              name: field.name,
              label: field.label,
              order: field.order,
              isActive: field.isActive,
              isRequired: field.isRequired,
            },
          });
        } else {
          // Create new field
          await tx.sortieFieldConfig.create({
            data: {
              productionCenterId: centerId,
              name: field.name,
              label: field.label,
              order: field.order,
              isActive: field.isActive,
              isRequired: field.isRequired,
            },
          });
        }
      }

      // Delete sortieFields that were removed (not in the new list)
      const sortieFieldIds = sortieFields.filter(f => f.id).map(f => f.id!);
      const sortieFieldsToDelete = existingSortie.filter(f => !sortieFieldIds.includes(f.id));

      for (const field of sortieFieldsToDelete) {
        // Check if field has any values
        const valueCount = await tx.sortieValue.count({
          where: { fieldConfigId: field.id },
        });

        if (valueCount > 0) {
          // Don't delete, just deactivate
          await tx.sortieFieldConfig.update({
            where: { id: field.id },
            data: { isActive: false },
          });
        } else {
          // Safe to delete
          await tx.sortieFieldConfig.delete({
            where: { id: field.id },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating fields:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
