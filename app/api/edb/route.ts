import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/auth-options';
import generateEDBId from './utils/edb-id-generator';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const skip = (page - 1) * pageSize;

    const [edbs, totalCount] = await Promise.all([
      prisma.etatDeBesoin.findMany({
        skip,
        take: pageSize,
        include: {
          category: true,
          department: true,
          userCreator: true,
          orders: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.etatDeBesoin.count(),
    ]);

    const formattedEDBs = edbs.map(edb => ({
      id: edb.edbId,
      title: edb.title,
      category: edb.category.name,
      status: edb.status,
      department: edb.department.name,
      amount: edb.orders.reduce((sum, order) => sum + order.amount, 0),
      email: edb.userCreator.email,
      items: edb.description.map(desc => {
        const match = desc.match(/^(.+) \(Quantité: (\d+)\)$/);
        return match ? { name: match[1], quantity: parseInt(match[2], 10) } : { name: desc, quantity: 1 };
      }),
      employee: {
        name: edb.userCreator.name,
        department: edb.department.name,
        email: edb.userCreator.email,
      },
      documents: [], // You'll need to fetch this separately if you're storing documents
      date: edb.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({
      edbs: formattedEDBs,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Error fetching EDAs:', error);
    return NextResponse.json({ error: 'Error fetching EDAs' }, { status: 500 });
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

    // Generate EDB ID
    const edbId = await generateEDBId();

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