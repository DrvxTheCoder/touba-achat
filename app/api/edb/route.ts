import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/auth-options';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
      }
  
      const edbs = await prisma.etatDeBesoin.findMany();
      return NextResponse.json(edbs);
    } catch (error) {
      console.error('Error fetching EDBs:', error);
      return NextResponse.json({ message: 'Error fetching EDBs' }, { status: 500 });
    }
  }

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'You must be logged in.' }, { status: 401 });
    }

    const { id: userId, status: userStatus } = session.user;

    if (userStatus !== 'ACTIVE') {
      return NextResponse.json({ message: 'Your account is not active.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category, reference, description } = body;

    // Fetch the user and their associated employee
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ message: 'User or employee not found' }, { status: 400 });
    }

    // Generate EDB ID (you can implement your own logic here)
    const edbId = `EDB-${Date.now()}`;

    // Create a new EDB
    const newEDB = await prisma.etatDeBesoin.create({
      data: {
        edbId,
        title,
        description,
        references: reference,
        status: 'DRAFT',
        department: { connect: { id: user.employee.currentDepartmentId } },
        creator: { connect: { id: user.employee.id } },
        userCreator: { connect: { id: user.id } },
        category: { connect: { id: parseInt(category) } },
      },
    });

    return NextResponse.json(newEDB, { status: 201 });
  } catch (error) {
    console.error('Error creating EDB:', error);
    return NextResponse.json({ message: 'Error creating EDB' }, { status: 500 });
  }
}