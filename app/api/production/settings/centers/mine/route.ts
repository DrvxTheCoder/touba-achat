import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

const PRIVILEGED_ROLES = ['ADMIN', 'DIRECTEUR_GENERAL', 'DOG', 'DIRECTEUR'];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const isPrivileged = PRIVILEGED_ROLES.includes(session.user.role);

    if (isPrivileged) {
      return NextResponse.json({ center: null, isPrivileged: true });
    }

    // Find center where user is one of the chefs
    const centerChef = await prisma.productionCenterChef.findFirst({
      where: { userId: parseInt(session.user.id) },
      include: {
        productionCenter: {
          include: {
            chefProductions: {
              include: {
                user: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!centerChef) {
      return NextResponse.json({ center: null, isPrivileged: false });
    }

    // Transform the response to maintain backward compatibility
    const center = {
      id: centerChef.productionCenter.id,
      name: centerChef.productionCenter.name,
      address: centerChef.productionCenter.address,
      // Keep chefProduction as the first chef for backward compatibility
      chefProduction: centerChef.productionCenter.chefProductions[0]?.user || null,
      // Add all chefs
      chefProductions: centerChef.productionCenter.chefProductions.map(cp => cp.user),
    };

    return NextResponse.json({ center, isPrivileged: false });
  } catch (error) {
    console.error('Error fetching user center:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
