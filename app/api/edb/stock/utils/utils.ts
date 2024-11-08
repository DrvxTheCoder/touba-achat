// app/api/stock-edb/utils.ts

import { prisma } from '@/lib/prisma';
import generateEDBId from '../../utils/edb-id-generator';
import { EDBEventType, Prisma, Role, StockEDBStatus, StockEtatDeBesoin } from '@prisma/client';
import { createEDBForUser, logEDBEvent, sendEDBNotification } from '../../utils/edbAuditLogUtil';
import { determineRecipients } from '@/app/api/utils/notificationsUtil';
import { generateNotificationMessage } from '@/app/api/utils/notificationMessage';
import { NotificationPayload, sendNotification } from '@/app/actions/sendNotification';


const UNRESTRICTED_ROLES = ['MAGASINIER', 'ADMIN', 'AUDIT', 'DIRECTEUR_GENERAL'] as const;

async function getUserName(userId: number): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });
  return user?.name || 'Utilisateur inconnu';
}

export async function sendStockNotification(
  stockEdb: StockEtatDeBesoin,
  action: EDBEventType,
  userId: number,
  additionalData?: Record<string, any>
): Promise<void> {
  const recipients = await determineRecipients(stockEdb, stockEdb.status, userId, 'STOCK');
  const userName = await getUserName(userId);
  const { subject, body } = generateNotificationMessage({
    id: stockEdb.edbId,
    status: stockEdb.status,
    actionInitiator: userName,
    entityType: 'STOCK'
  });

  const notificationPayload: NotificationPayload = {
    entityId: stockEdb.edbId,
    entityType: 'STOCK',
    newStatus: stockEdb.status,
    actorId: userId,
    actionInitiator: userName,
    additionalData: { 
      updatedBy: userId, 
      departmentId: stockEdb.departmentId,
      ...additionalData
    }
  };

  await sendNotification(notificationPayload);
}


export async function createStockEDB(
  data: {
    description: {
      items: Array<{ name: string; quantity: number }>;
      comment?: string;
    };
    categoryId: number;
    employeeType: 'registered' | 'external';
    employeeId?: number;
    departmentId?: number;  // Optional since we'll get it from employee for registered users
    externalEmployeeName?: string;
  }
) {
  // For registered employees, get their department
  if (data.employeeType === 'registered' && data.employeeId) {
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
      include: { currentDepartment: true, user:true }
    });

    if (!employee) {
      throw new Error('Employé introuvable');
    }

    const newStockEDB = await prisma.stockEtatDeBesoin.create({
      data: {
        edbId: generateEDBId(),
        description: data.description as Prisma.JsonObject,
        employee: { connect: { id: data.employeeId } },
        department: { connect: { id: employee.currentDepartmentId } },
        category: { connect: { id: data.categoryId } },
      },
      include: {
        department: true,
        category: true,
        employee: true
      }
    });

    await sendStockNotification(newStockEDB, EDBEventType.SUBMITTED, employee.user.id);
  } 
  // For external employees
  else {
    if (!data.departmentId) {
      throw new Error('Département requis pour les employés externes');
    }

    return await prisma.stockEtatDeBesoin.create({
      data: {
        edbId: generateEDBId(),
        description: data.description as Prisma.JsonObject,
        externalEmployeeName: data.externalEmployeeName,
        department: { connect: { id: data.departmentId } },
        category: { connect: { id: data.categoryId } },
      },
      include: {
        department: true,
        category: true,
        employee: true
      }
    });
  }
}

export async function createUserStockEDB(
  userId: number,
  data: {
    description: {
      items: Array<{ name: string; quantity: number }>;
      comment?: string;
    };
    categoryId: number;
  }
) {
  // Get user and employee details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        include: {
          currentDepartment: true
        }
      }
    }
  });

  if (!user?.employee) {
    throw new Error('Utilisateur ou employé introuvable');
  }

  // Create the stock EDB
  return await prisma.stockEtatDeBesoin.create({
    data: {
      edbId: generateEDBId(),
      description: data.description as Prisma.JsonObject,
      employee: { connect: { id: user.employee.id } },
      department: { connect: { id: user.employee.currentDepartmentId } },
      category: { connect: { id: data.categoryId } },
      status: 'SUBMITTED', // Always submit immediately for users
    },
    include: {
      category: true
    }
  });
}

export async function getStockEDBs(params?: {
  departmentId?: number;
  employeeId?: number;
  categoryId?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  userRole?: Role;
  userId?: number;
}) {
  const skip = params?.page && params?.pageSize ? (params.page - 1) * params.pageSize : undefined;
  const take = params?.pageSize;

  // Build the where condition
  const where: Prisma.StockEtatDeBesoinWhereInput = {
    // Base filters
    ...(params?.categoryId && { categoryId: params.categoryId }),

    // Role-based filtering
    ...(!UNRESTRICTED_ROLES.includes(params?.userRole as typeof UNRESTRICTED_ROLES[number]) && {
      employee: {
        userId: params?.userId // Filter by user ID for regular users
      }
    }),

    // Search conditions
    ...(params?.search ? {
      OR: [
        { 
          edbId: { 
            contains: params.search,
            mode: 'insensitive' as Prisma.QueryMode
          } 
        },
        {
          description: {
            path: ['items'],
            array_contains: [{
              name: { contains: params.search }
            }]
          } as Prisma.JsonFilter
        }
      ]
    } : {})
  };

  // Get total count for pagination
  const total = await prisma.stockEtatDeBesoin.count({ where });

  // Get filtered and paginated data
  const data = await prisma.stockEtatDeBesoin.findMany({
    where,
    include: {
      department: true,
      category: true,
      employee: true,
      orderedBy: true,
      deliveredBy: true,
      convertedBy: true,
      convertedEdb: {
        select: {
          id: true,
          edbId: true,
          status: true,
          auditLogs: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              eventAt: 'asc'
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take,
  });


  return {
    data,
    total,
    page: params?.page || 1,
    pageSize: params?.pageSize || 10
  };
}

export async function getStockEDBById(id: number, userRole?: Role, userId?: number) {
  const where: Prisma.StockEtatDeBesoinWhereInput = {
    id,
    ...(!UNRESTRICTED_ROLES.includes(userRole as typeof UNRESTRICTED_ROLES[number]) && {
      employee: {
        userId: userId
      }
    })
  };

  const stockEdb = await prisma.stockEtatDeBesoin.findFirst({
    where,
    include: {
      department: true,
      category: true,
      employee: {
        include: {
          user: true
        }
      },
      orderedBy: true,
      deliveredBy: true,
      convertedBy: true,
      convertedEdb: {  // Now we can include this
        include: {
          auditLogs: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            },
            orderBy: {
              eventAt: 'asc'
            }
          },
          creator: true,
          category: true,
          department: true,
        }
      }
    }
  });

  if (!stockEdb) {
    throw new Error('EDB de stock introuvable ou accès non autorisé');
  }

  return stockEdb;
}

export async function updateStockEDBStatus(
  stockEdbId: number,
  status: StockEDBStatus,
  magasinierId: number
) {
  const magasinier = await prisma.user.findUnique({
    where: { id: magasinierId },
  });

  if (!magasinier || magasinier.role !== 'MAGASINIER') {
    throw new Error('Non autorisé: Seuls les magasiniers peuvent mettre à jour le statut');
  }

  const updateData: Prisma.StockEtatDeBesoinUpdateInput = {
    status,
    updatedAt: new Date(),
  };

  // Add specific timestamp and user based on status
  switch (status) {
    case 'ORDERED':
      updateData.orderedAt = new Date();
      updateData.orderedBy = { connect: { id: magasinierId } };
      break;
    case 'DELIVERED':
      updateData.deliveredAt = new Date();
      updateData.deliveredBy = { connect: { id: magasinierId } };
      break;
  }

  return await prisma.stockEtatDeBesoin.update({
    where: { id: stockEdbId },
    data: updateData,
    include: {
      department: true,
      category: true,
      employee: true,
    }
  });
}

export async function convertToStandardEDB(
  stockEdbId: number,
  magasinierId: number
) {
  // Verify magasinier
  const magasinier = await prisma.user.findUnique({
    where: { id: magasinierId },
    include: { employee: true },
  });

  if (!magasinier || magasinier.role !== 'MAGASINIER') {
    throw new Error('Non autorisé: Seuls les magasiniers peuvent convertir les EDBs');
  }

  const stockEdb = await prisma.stockEtatDeBesoin.findUnique({
    where: { id: stockEdbId },
    include: {
      employee: {
        include: {
          user: true
        }
      },
      department: true,
      category: true,
    }
  });

  if (!stockEdb) {
    throw new Error('EDB de stock introuvable');
  }

  if (stockEdb.status === 'CONVERTED') {
    throw new Error('Cet EDB de stock a déjà été converti');
  }

  return await prisma.$transaction(async (prisma) => {
    // Transform the description
    const stockDescription = stockEdb.description as any;
    const transformedItems = stockDescription.items.map((item: any) => ({
      designation: item.name,
      quantity: item.quantity
    }));

    // Create standard EDB using the existing function
    const standardEdb = await createEDBForUser(
      magasinierId,
      stockEdb.employee!.user.id,
      {
        category: stockEdb.categoryId,
        items: transformedItems,
        existingEdbId: stockEdb.edbId, // Use the existing EDB ID
      }
    );

    // Update stock EDB status
    const updatedStockEDB = await prisma.stockEtatDeBesoin.update({
      where: { id: stockEdbId },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedBy: { connect: { id: magasinierId } },
        convertedEdb: { connect: { id: standardEdb.id } }
      }
    });

    await sendStockNotification(updatedStockEDB, EDBEventType.CONVERTED, magasinierId);


    // Return the complete EDB with audit logs
    return await prisma.etatDeBesoin.findUnique({
      where: { id: standardEdb.id },
      include: {
        department: true,
        category: true,
        creator: true,
        auditLogs: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            eventAt: 'asc'
          }
        }
      }
    });
  });
}

/**
 * Retrieves a converted EDB's details including its standard EDB information
 */
export async function getConvertedEDBDetails(stockEdbId: number) {
  return await prisma.stockEtatDeBesoin.findUnique({
    where: { 
      id: stockEdbId,
      status: 'CONVERTED'
    },
    include: {
      department: true,
      category: true,
      employee: true,
      convertedBy: true,
      orderedBy: true,
      deliveredBy: true
    }
  });
}