import { NextResponse } from 'next/server';
import { EDBEventType, PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/auth-options';
import generateEDBId from './utils/edb-id-generator';
import { Prisma, EDBStatus } from '@prisma/client';
import { logEDBEvent } from './utils/edbAuditLogUtil';

const prisma = new PrismaClient();



export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = session.user.role;
    const skip = (page - 1) * pageSize;

    const statusFilter = status ? status.split(',') as EDBStatus[] : [];

    let where: Prisma.EtatDeBesoinWhereInput = {
      OR: [
        { edbId: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { 
          description: {
            path: ['items'],
            array_contains: [{ designation: { contains: search } }]
          }
        },
      ],
      ...(statusFilter.length > 0 ? { status: { in: statusFilter } } : {}),
    };

    // Role-based filtering
    switch (role) {
      case 'RESPONSABLE':
      case 'DIRECTEUR':
        const employee = await prisma.employee.findUnique({
          where: { userId: parseInt(session.user.id) },
          select: { currentDepartmentId: true }
        });
        if (employee) {
          where.departmentId = employee.currentDepartmentId;
        }
        break;
      case 'IT_ADMIN':
        const itEmployee = await prisma.employee.findUnique({
          where: { userId: parseInt(session.user.id) },
          select: { currentDepartmentId: true }
        });
        where = {
          AND: [
            { ...where }, // Keep existing search and status filters
            {
              OR: [
                { departmentId: itEmployee?.currentDepartmentId },
                { 
                  category: { 
                    name: { 
                      in: ['Logiciels et licences', 'Matériel informatique'] 
                    } 
                  } 
                }
              ]
            }
          ]
        };
      break;
      case 'ADMIN':
      case 'DIRECTEUR_GENERAL':
      case 'AUDIT':
        // No additional filtering, they can see all EDAs
        break;
      default:
        // For any other role, only show their own department's EDAs
        const defaultEmployee = await prisma.employee.findUnique({
          where: { userId: parseInt(session.user.id) },
          select: { currentDepartmentId: true }
        });
        if (defaultEmployee) {
          where.departmentId = defaultEmployee.currentDepartmentId;
        }
        break;
    }

    const [edbs, totalCount] = await Promise.all([
      prisma.etatDeBesoin.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          category: true,
          department: true,
          userCreator: true,
          orders: true,
          attachments: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.etatDeBesoin.count({ where }),
    ]);

    const formattedEDBs = edbs.map(edb => ({
      id: edb.edbId,
      queryId: edb.id,
      title: edb.title,
      category: edb.category.name,
      status: edb.status,
      department: edb.department.name,
      amount: edb.orders.reduce((sum: number, order: { amount: number }) => sum + order.amount, 0),
      email: edb.userCreator.email,
      items: (edb.description as any).items.map((item: { designation: string, quantity: number }) => ({
        designation: item.designation,
        quantity: item.quantity
      })),
      employee: {
        name: edb.userCreator.name,
        department: edb.department.name,
        email: edb.userCreator.email,
      },
      documents: edb.attachments.map(attachment => attachment.fileName),
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
    const { title, category, reference, items } = body;

    console.log('Received body:', body);

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: { employee: true },
    });

    if (!user || !user.employee) {
      return NextResponse.json({ message: 'User or employee not found' }, { status: 400 });
    }

    console.log('User:', user);

    // Generate EDB ID
    let edbId;
    let newEDB;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        edbId = await generateEDBId();
        console.log('Generated EDB ID:', edbId);

        // Prepare the data for creating the EDB
        const edbData = {
          edbId,
          title,
          description: { items },
          references: reference,
          status: 'SUBMITTED' as EDBStatus,
          department: { connect: { id: user.employee.currentDepartmentId } },
          creator: { connect: { id: user.employee.id } },
          userCreator: { connect: { id: user.id } },
          category: { connect: { id: parseInt(category) } },
        };

        console.log('EDB Data:', edbData);

        // Create the new EDB
        newEDB = await prisma.etatDeBesoin.create({
          data: edbData,
        });

        console.log('Created EDB:', newEDB);
        break; // If successful, break out of the loop
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          // If it's a unique constraint violation, try again
          attempts++;
          console.log(`Attempt ${attempts}: EDB ID already exists, trying again...`);
        } else {
          // If it's any other error, throw it
          throw error;
        }
      }
    }

    if (!newEDB) {
      throw new Error('Failed to create EDB after multiple attempts');
    }

    // Log the EDB creation event
    await logEDBEvent(newEDB.id, parseInt(userId), EDBEventType.CREATED);

    return NextResponse.json(newEDB, { status: 201 });
  } catch (error) {
    console.error('Error creating EDB:', error);
    return NextResponse.json({ message: 'Error creating EDB', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}