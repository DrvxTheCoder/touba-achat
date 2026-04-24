import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { pathname, sessionToken } = body as { pathname: string; sessionToken?: string };

    if (!pathname) {
      return NextResponse.json({ error: 'pathname requis' }, { status: 400 });
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const userId = parseInt(session.user.id);

    let sessionId: number | undefined;
    if (sessionToken) {
      const userSession = await prisma.userSession.findUnique({
        where: { sessionToken },
        select: { id: true },
      });
      sessionId = userSession?.id;
    }

    await prisma.userActivity.create({
      data: {
        userId,
        pathname,
        ipAddress,
        ...(sessionId ? { sessionId } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
