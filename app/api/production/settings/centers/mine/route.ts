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

    const center = await prisma.productionCenter.findFirst({
      where: { chefProductionId: parseInt(session.user.id) },
      select: {
        id: true,
        name: true,
        address: true,
        chefProduction: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ center, isPrivileged: false });
  } catch (error) {
    console.error('Error fetching user center:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
