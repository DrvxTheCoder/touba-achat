import { NextResponse } from 'next/server';
import { PrismaClient, EDBStatus } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'; // Adjust this import path as necessary

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const { role } = session.user;

  try {
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: Number(id) },
      include: { department: true, category: true },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB not found' }, { status: 404 });
    }

    // Determine the new status based on the user's role and current EDB status
    let newStatus: EDBStatus;
    switch (role) {
      case 'RESPONSABLE':
        if (edb.status === 'SUBMITTED') {
          newStatus = 'APPROVED_RESPONSABLE';
        } else {
            return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      case 'DIRECTEUR':
        if (edb.status === 'SUBMITTED') {
          newStatus = 'APPROVED_DIRECTEUR';
        } else {
          return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      case 'IT_ADMIN':
        if (edb.status === 'AWAITING_IT_APPROVAL' && 
            (edb.category.name === 'Logiciels et licences' || edb.category.name === 'Matériel informatique')) {
          newStatus = 'IT_APPROVED';
        } else {
          return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      case 'DIRECTEUR_GENERAL':
        if (edb.status === 'AWAITING_FINAL_APPROVAL') {
          newStatus = 'APPROVED_DG';
        } else {
          return NextResponse.json({ message: 'Non autorisé à approuver à cette étape' }, { status: 403 });
        }
        break;
      default:
        return NextResponse.json({ message: 'Action non autorisé' }, { status: 403 });
    }

    // Update the EDB with the new status
    const updatedEdb = await prisma.etatDeBesoin.update({
      where: { id: Number(id) },
      data: { 
        status: newStatus,
        approverId: parseInt(session.user.id),
      },
    });

    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Error validating EDB:', error);
    return NextResponse.json({ message: 'Une erreur inattendue s\'est produite. Veuillez ressayer plus tard.' }, { status: 500 });
  }
}