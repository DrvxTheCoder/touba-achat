// app/api/admin/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password in the database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}