import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@prisma/client';

// GET /api/users - List users with optional access filter
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accessFilter = searchParams.get('access');

    const where = accessFilter
      ? {
          access: {
            has: accessFilter as any,
          },
          status: UserStatus.ACTIVE,
        }
      : {
          status: UserStatus.ACTIVE,
        };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        access: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Erreur récupération utilisateurs:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}
