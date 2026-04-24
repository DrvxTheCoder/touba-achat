import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') ?? '0');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const sessions = await prisma.userSession.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      take: 50,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        loginAt: true,
        lastActiveAt: true,
        expiresAt: true,
        isRevoked: true,
        revokedAt: true,
        revokedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { sessionId } = await request.json() as { sessionId: number };
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requis' }, { status: 400 });
    }

    const revokedById = parseInt(session.user.id);

    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedById,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error revoking session:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
