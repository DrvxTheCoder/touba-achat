// app/api/edb/helper-edb/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { createEDBForUser } from '../utils/edbAuditLogUtil';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
    }

    const { id: loggedInUserId, status: userStatus, role } = session.user;

    if (userStatus !== 'ACTIVE') {
      return NextResponse.json({ message: 'Your account is not active.' }, { status: 403 });
    }

    // Check if the logged-in user has permission to create an EDA for others
    if (!['ADMIN', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'RESPONSABLE'].includes(role)) {
      return NextResponse.json({ message: 'You do not have permission to create an EDA for another user.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, reference, items, userId } = body;

    if (!userId) {
      return NextResponse.json({ message: 'ID requit.' }, { status: 400 });
    }

    const newEDB = await createEDBForUser(parseInt(loggedInUserId), parseInt(userId), {
      title,
      category: parseInt(category),
      reference,
      items
    });

    return NextResponse.json(newEDB, { status: 201 });
  } catch (error) {
    console.error('Error creating EDB:', error);
    // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    //   return NextResponse.json({ message: 'A unique constraint error occurred. Please try again.' }, { status: 409 });
    // }
    return NextResponse.json({ message: 'Error creating EDB', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}