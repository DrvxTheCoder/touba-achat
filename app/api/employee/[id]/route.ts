import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(params.id);

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            currentDepartment: true,
          },
        },
        createdEdbs: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const { password, ...userInfoWithoutPassword } = userInfo;
    const totalEDBs = userInfo.createdEdbs.length;

    return NextResponse.json({
      ...userInfoWithoutPassword,
      totalEDBs,
    });
  } catch (error) {
    console.error('Erreur dans GET /api/user/[id]:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID d\'employé invalide' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 });
    }

    // Au lieu de supprimer, nous mettons à jour le statut de l'employé
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    // Mettre à jour le statut de l'utilisateur associé si nécessaire
    if (employee.user) {
      await prisma.user.update({
        where: { id: employee.user.id },
        data: { status: 'INACTIVE' }
      });
    }

    return NextResponse.json(
      { message: 'Employé archivé avec succès', employee: updatedEmployee },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de l\'archivage de l\'employé:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage de l\'employé' },
      { status: 500 }
    );
  }
}