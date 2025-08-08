import { NextResponse } from 'next/server';
import { EDBEventType, PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '../auth/[...nextauth]/auth-options';
import generateEDBId from './utils/edb-id-generator';
import { Prisma, EDBStatus } from '@prisma/client';
import { createEDB} from './utils/edbAuditLogUtil';
import { determineRecipients, getNotificationTypeFromStatus } from '../utils/notificationsUtil';
import { NotificationPayload, sendNotification } from '@/app/actions/sendNotification';


const prisma = new PrismaClient();

function getDateRange(timeRange: string): { gte: Date; lte: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeRange) {
    case 'today':
      return {
        gte: today,
        lte: now
      };
      
    case 'this-week': {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return {
        gte: monday,
        lte: now
      };
    }
      
    case 'this-month':
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: now
      };
      
    case 'last-month': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        gte: firstDayLastMonth,
        lte: lastDayLastMonth
      };
    }
      
    case 'last-3-months':
      return {
        gte: new Date(now.getFullYear(), now.getMonth() - 3, 1),
        lte: now
      };
      
    case 'this-year':
      return {
        gte: new Date(now.getFullYear(), 0, 1),
        lte: now
      };
      
    case 'last-year':
      return {
        gte: new Date(now.getFullYear() - 1, 0, 1),
        lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      };

    case 'alltime':
      return {
        gte: new Date(2000, 0, 1),
        lte: new Date(2100, 0, 1),
      };
      
    default:
      return {
        gte: new Date(now.getFullYear(), now.getMonth(), 1),
        lte: now
      };
  }
}



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
    const timeRange = searchParams.get('timeRange') || 'this-month';
    const dateRange = getDateRange(timeRange);

    const statusFilter = status ? status.split(',') as EDBStatus[] : [];

    let where: Prisma.EtatDeBesoinWhereInput = {
      createdAt: dateRange,
      OR: [
        { edbId: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { 
          description: {
            path: ['items'],
            array_contains: [{ designation: { contains: search } }]
          }
        },
        { userCreator: { name: { contains: search, mode: 'insensitive' } } },
        { userCreator: { email: { contains: search, mode: 'insensitive' } } },
        { department: { name: { contains: search, mode: 'insensitive' } } },
      ],
      ...(statusFilter.length > 0 ? { status: { in: statusFilter } } : {}),
    };
    

    // Role-based filtering
    switch (role) {
      case 'RESPONSABLE':
      // case 'DIRECTEUR':
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
      // case 'MAGASINIER':
      //   // Show only validated EDBs (approved by director or higher)
      //   where = {
      //     AND: [
      //       { ...where }, // Keep existing search and status filters
      //       {
      //         status: {
      //           notIn: [
      //             'DRAFT',
      //             'SUBMITTED',
      //             'APPROVED_RESPONSABLE',
      //             'REJECTED'
      //           ]
      //         }
      //       }
      //     ]
      //   };
      // break;
      case 'MAGASINIER':
      case 'ADMIN':
      case 'DIRECTEUR_GENERAL':
      case 'AUDIT':
        break;
      default:
        // For any other role, only show their own department's EDBs
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
          finalSupplier: true,
          attachments: true,
          auditLogs: {
            include: {
              user: true
            },
            orderBy: {
              eventAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.etatDeBesoin.count({ where }),
    ]);

    const formattedEDBs = edbs.map(edb => ({
      id: edb.id,
      edbId: edb.edbId,
      title: edb.title,
      category: edb.category.name,
      status: edb.status,
      department: edb.department.name,
      references: edb.references,
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
      auditLogs: edb.auditLogs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        eventAt: log.eventAt.toISOString(),
        user: {
          name: log.user.name,
        },
      })),
      attachments: edb.attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        supplierName: attachment.supplierName,
        totalAmount: attachment.totalAmount,
      })),
      finalSupplier: edb.finalSupplier ? {
        id: edb.finalSupplier.id,
        filePath: edb.finalSupplier.filePath,
        supplierName: edb.finalSupplier.supplierName,
        amount: edb.finalSupplier.amount,
        chosenAt: edb.finalSupplier.chosenAt.toISOString(),
        chosenBy: edb.finalSupplier.chosenBy,
      } : null,
      rejectionReason: edb.rejectionReason,
      itApprovalRequired: edb.itApprovalRequired
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
      return NextResponse.json({ message: 'Connexion requise.' }, { status: 401 });
    }

    const { id: userId, status: userStatus, role } = session.user;

    if (userStatus !== 'ACTIVE') {
      return NextResponse.json({ message: 'Votre compte est inactif. Veuillez contacter votre administrateur.' }, { status: 403 });
    }

    const body = await request.json();
    // const { title, category, reference, items } = body;
    const { category, reference, items } = body;

    console.log('Received body:', body);

    const newEDB = await createEDB(parseInt(userId), {
      // title,
      category: parseInt(category),
      reference,
      items
    });

    console.log('Created EDB:', newEDB);

    // Send notification for new EDB
    const recipients = await determineRecipients(newEDB, newEDB.status, parseInt(userId), 'EDB');
    // Send notification for new EDB
    await sendNotification({
      entityId: newEDB.edbId,
      entityType: 'EDB',
      newStatus: newEDB.status,
      actorId: parseInt(userId),
      actionInitiator: session.user.name || 'Un utilisateur',
      additionalData: { createdBy: userId, departmentId: newEDB.departmentId }
    });

    return NextResponse.json(newEDB, { status: 201 });
  } catch (error) {
    console.error('Error creating EDB:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'A unique constraint error occurred. Please try again.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Error creating EDB', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
