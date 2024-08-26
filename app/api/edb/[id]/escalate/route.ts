// api/edb/[id]/escalate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { escalateEDB } from '../../utils/edbAuditLogUtil'; // Import the utility function

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }
  if (session.user.role !== "DIRECTEUR") {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { id } = params;
  const { role } = session.user;

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { department: true, category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB introuvable' }, { status: 404 });
    }

    const updatedEdb = await escalateEDB(Number(id), parseInt(session.user.id), 'Escalation reason');

    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Error validating EDB:', error);
    return NextResponse.json({ message: 'Une erreur inattendue s\'est produite. Veuillez ressayer plus tard.' }, { status: 500 });
  }
}