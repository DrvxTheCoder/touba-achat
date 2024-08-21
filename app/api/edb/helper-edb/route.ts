// app/api/edb/create-for-other/route.ts

import { NextResponse } from 'next/server';
import { EDBEventType, PrismaClient, EDBStatus } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import generateEDBId from '../utils/edb-id-generator';
import { Prisma } from '@prisma/client';
import { logEDBEvent } from '../utils/edbAuditLogUtil';

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

    console.log('Received body:', body);

    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { employee: true },
    });

    if (!targetUser || !targetUser.employee) {
      return NextResponse.json({ message: 'Impossible de trouver l\'employé' }, { status: 400 });
    }

    console.log('Target User:', targetUser);

    // Generate EDB ID
    const edbId = generateEDBId();
    console.log('Generated EDB ID:', edbId);

    // Determine initial status based on the target user's role
    let initialStatus: EDBStatus = 'SUBMITTED';
    if (targetUser.role === 'RESPONSABLE') {
      initialStatus = 'APPROVED_RESPONSABLE';
    } else if (targetUser.role === 'DIRECTEUR') {
      initialStatus = 'APPROVED_DIRECTEUR';
    } else if (targetUser.role === 'DIRECTEUR_GENERAL') {
      initialStatus = 'APPROVED_DG';
    }

    // Prepare the data for creating the EDB
    const edbData = {
      edbId,
      title,
      description: { items },
      references: reference,
      status: initialStatus,
      department: { connect: { id: targetUser.employee.currentDepartmentId } },
      creator: { connect: { id: targetUser.employee.id } },
      userCreator: { connect: { id: targetUser.id } },
      category: { connect: { id: parseInt(category) } },
    };

    console.log('EDB Data:', edbData);

    // Create the new EDB
    const newEDB = await prisma.etatDeBesoin.create({
      data: edbData,
    });

    console.log('Created EDB:', newEDB);

    // Log the EDB creation event
    await logEDBEvent(newEDB.id, parseInt(loggedInUserId), EDBEventType.SUBMITTED);

    // If the initial status is not SUBMITTED, log a separate validation event
    if (initialStatus !== 'SUBMITTED') {
      let validationEventType: EDBEventType;
      switch (initialStatus) {
        case 'APPROVED_RESPONSABLE':
          validationEventType = EDBEventType.APPROVED_RESPONSABLE;
          break;
        case 'APPROVED_DIRECTEUR':
          validationEventType = EDBEventType.APPROVED_DIRECTEUR;
          break;
        case 'APPROVED_DG':
          validationEventType = EDBEventType.APPROVED_DG;
          break;
        default:
          validationEventType = EDBEventType.UPDATED;
      }
      await logEDBEvent(newEDB.id, parseInt(loggedInUserId), validationEventType);
    }

    return NextResponse.json(newEDB, { status: 201 });
  } catch (error) {
    console.error('Error creating EDB:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'A unique constraint error occurred. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating EDB', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}