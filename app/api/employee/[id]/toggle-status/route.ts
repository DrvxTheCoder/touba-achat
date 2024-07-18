// app/api/employee/[id]/toggle-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isActive } = await req.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { status: isActive ? 'ACTIVE' : 'INACTIVE' },
    });

    // Also update the associated user account if it exists
    if (updatedEmployee.userId) {
      await prisma.user.update({
        where: { id: updatedEmployee.userId },
        data: { status: isActive ? 'ACTIVE' : 'INACTIVE' },
      });
    }

    return NextResponse.json(
        { message: 'Employé archivé avec succès', employee: updatedEmployee },
        { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'archivage de l\'employé:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'archivage de l\'employé' },
      { status: 500 }
    );
  }
}