import { prisma } from "@/lib/prisma";
import { Access, BDCEventType, BDCStatus, NotificationType, Role } from "@prisma/client";

type ExpenseItem = {
  item: string;
  amount: number;
};

type EmployeeInfo = {
  name: string;
  role: string;
};

type CreateBDCInput = {
    title: string;
    description: ExpenseItem[];
    employees?: EmployeeInfo[]; // Made optional
    comment?: string;
    departmentId: number;
    creatorId: number;
    userCreatorId: number;
  };

async function generateBDCId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const day = new Date().getDay();
  const count = await prisma.bonDeCaisse.count({
    where: {
      bdcId: {
        startsWith: `BDC${currentYear}${currentMonth}`,
      },
    },
  });
  return `BDC${currentYear}${currentMonth}${day}-${(count + 1).toString().padStart(3, '0')}`;
}

async function createNotification(
  tx: any,
  type: NotificationType,
  message: string,
  recipientIds?: number[],
  bdcId?: number
) {
  const notification = await tx.notification.create({
    data: {
      type,
      message,
      bonDeCaisseId: bdcId,
      recipients: {
        create: recipientIds?.map(userId => ({
          user: {
            connect: { id: userId }
          }
        }))
      }
    },
  });
  return notification;
}

async function logBDCEvent(
    tx: any,
    bdcId: number,
    userId: number,
    eventType: BDCEventType,
    details?: any
  ) {
    return tx.bonDeCaisseAuditLog.create({
      data: {
        bonDeCaisseId: bdcId,
        userId,
        eventType,
        details: details || undefined,
      },
    });
  }

  export async function createBDC(input: CreateBDCInput) {
    const totalAmount = input.description.reduce((sum, item) => sum + item.amount, 0);
    const bdcId = await generateBDCId();
  
    return prisma.$transaction(async (tx) => {
      // Get user role to determine initial status
      const user = await tx.user.findUnique({
        where: { id: input.userCreatorId }
      });
  
      if (!user) throw new Error("Utilisateur non trouvé");
  
      let initialStatus: BDCStatus;
      let notificationType: NotificationType;
      let targetRoles: Role[] = [];

      if (user.access.includes(Access.APPROVE_BDC)) {
        initialStatus = BDCStatus.APPROVED_DIRECTEUR;
        notificationType = NotificationType.BDC_APPROVED_DIRECTOR;
        targetRoles = [Role.DAF];
      }
      else {
        switch (user.role) {
          case Role.DAF:
            initialStatus = BDCStatus.APPROVED_DIRECTEUR;
            notificationType = NotificationType.BDC_APPROVED_DIRECTOR;
            break;
          case Role.DIRECTEUR:
          case Role.DIRECTEUR_GENERAL:
          case Role.DOG:
          case Role.DRH:
          case Role.DCM:
          case Role.ADMIN:
            initialStatus = BDCStatus.APPROVED_DIRECTEUR;
            notificationType = NotificationType.BDC_APPROVED_DIRECTOR;
            targetRoles = [Role.DAF];
            break;
          case Role.RESPONSABLE:
          case Role.RH:
            initialStatus = BDCStatus.APPROVED_RESPONSABLE;
            notificationType = NotificationType.BDC_APPROVED_RESPONSABLE;
            targetRoles = [Role.DIRECTEUR, Role.DIRECTEUR_GENERAL, Role.DOG];
            break;
          default:
            initialStatus = BDCStatus.SUBMITTED;
            notificationType = NotificationType.BDC_CREATED;
            targetRoles = [Role.RESPONSABLE, Role.DIRECTEUR, Role.DIRECTEUR_GENERAL];
        }
      }
  

  
      const bdc = await tx.bonDeCaisse.create({
        data: {
          bdcId,
          title: input.title,
          description: input.description,
          employees: input.employees || [],
          comment: input.comment,
          totalAmount,
          departmentId: input.departmentId,
          creatorId: input.creatorId,
          userCreatorId: input.userCreatorId,
          status: initialStatus,
        },
      });

      if (initialStatus === BDCStatus.APPROVED_RESPONSABLE) {
        // First notify immediate approvers (Directors)
        if (targetRoles.length > 0) {
          const immediateApprovers = await tx.employee.findMany({
            where: {
              currentDepartmentId: input.departmentId,
              user: {
                role: { in: targetRoles },
                status: 'ACTIVE'
              }
            },
            select: { user: { select: { id: true } } }
          });
      
          const immediateApproverIds = immediateApprovers.map(emp => emp.user.id);
          if (immediateApproverIds.length > 0) {
            await createNotification(
              tx,
              notificationType,
              `Nouveau bon de caisse ${bdcId} à valider - ${user.name}`,
              immediateApproverIds,
              bdc.id
            );
          }
        }
      

      } else if(initialStatus === BDCStatus.APPROVED_DIRECTEUR){
                  // Also notify DAF 
        const dafUsers = await tx.user.findMany({
          where: {
            role: Role.DAF,
            status: 'ACTIVE'
          },
          select: { id: true }
        });
      
        if (dafUsers.length > 0) {
          await createNotification(
            tx,
            NotificationType.BDC_APPROVED_DIRECTOR,
            `Nouveau bon de caisse ${bdcId} en attente de validation finale - ${user.name}`,
            dafUsers.map(u => u.id),
            bdc.id
          );
        }
      } else {
        // Original notification logic for other statuses
        if (targetRoles.length > 0) {
            if (targetRoles.length > 0) {
                const nextApprovers = await tx.employee.findMany({
                  where: {
                    currentDepartmentId: input.departmentId,
                    user: {
                      role: { in: targetRoles },
                      status: 'ACTIVE'
                    }
                  },
                  select: {
                    user: {
                      select: { id: true }
                    }
                  }
                });
          
                const approverIds = nextApprovers.map(emp => emp.user.id);
                if (approverIds.length > 0) {
                  await createNotification(
                    tx,
                    notificationType,
                    `Nouveau bon de caisse ${bdcId} à valider - ${user.name}`,
                    approverIds,
                    bdc.id
                  );
                }
              }
        }
      }
  
  
      await logBDCEvent(tx, bdc.id, input.userCreatorId, BDCEventType.SUBMITTED);
  
      return bdc;
    });
  }

export async function submitBDC(bdcId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { id: bdcId },
      include: {
        department: true
      }
    });

    if (!bdc) throw new Error("BDC introuvable");

    const updatedBdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: { status: BDCStatus.SUBMITTED },
    });

    // Find responsables in the department
    const responsables = await tx.employee.findMany({
      where: {
        currentDepartmentId: bdc.departmentId,
        user: {
          role: Role.RESPONSABLE,
          status: 'ACTIVE'
        }
      },
      select: {
        user: {
          select: { id: true }
        }
      }
    });

    const responsableIds = responsables.map(r => r.user.id);

    if (responsableIds.length > 0) {
      await createNotification(
        tx,
        NotificationType.BDC_CREATED,
        `Nouveau bon de caisse ${bdc.bdcId} à valider`,
        responsableIds,
        bdc.id
      );
    }

    await logBDCEvent(tx, bdcId, userId, BDCEventType.SUBMITTED);

    return updatedBdc;
  });
}

export async function approveBDC(
  bdcId: number,
  userId: number,
  userRole: Role
) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { id: bdcId },
      include: {
        department: true
      }
    });

    if (!bdc) throw new Error("BDC introuvable");

    let newStatus: BDCStatus;
    let notificationType: NotificationType;
    let eventType: BDCEventType;
    let nextApproversRoles: Role[] = [];

    switch (userRole) {
      case Role.RESPONSABLE:
        newStatus = BDCStatus.APPROVED_RESPONSABLE;
        notificationType = NotificationType.BDC_APPROVED_RESPONSABLE;
        eventType = BDCEventType.APPROVED_RESPONSABLE;
        nextApproversRoles = [Role.DIRECTEUR, Role.DIRECTEUR_GENERAL, Role.DOG];
        break;

      case Role.DIRECTEUR:
      case Role.DIRECTEUR_GENERAL:
      case Role.DOG:
      case Role.DRH:
      case Role.DCM:
      case Role.DAF:
        newStatus = BDCStatus.APPROVED_DIRECTEUR;
        notificationType = NotificationType.BDC_APPROVED_DIRECTOR;
        eventType = BDCEventType.APPROVED_DIRECTEUR;
        nextApproversRoles = [Role.DAF];
        break;

      default:
        throw new Error("Rôle non autorisé pour l'approbation");
    }

    // Update BDC
    const updatedBdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: {
        status: newStatus,
        approverId: userId,
      },
    });

    // Find next approvers
    const nextApprovers = await tx.user.findMany({
      where: {
        role: { in: nextApproversRoles },
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    const nextApproverIds = nextApprovers.map(user => user.id);

    if (nextApproverIds.length > 0) {
      await createNotification(
        tx,
        notificationType,
        `Le bon de caisse ${bdc.bdcId} a été approuvé et nécessite votre validation`,
        nextApproverIds,
        bdc.id
      );
    }
    await createNotification(tx, notificationType, `Le bon de caisse ${bdc.bdcId} a été approuvé par votre direction`, undefined, bdc.id)

    await logBDCEvent(tx, bdcId, userId, eventType);

    return updatedBdc;
  });
}

export async function rejectBDC(
  bdcId: number,
  userId: number,
  rejectionReason: string
) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: {
        status: BDCStatus.REJECTED,
        rejectionReason,
        approverId: userId,
      },
      include: {
        userCreator: true
      }
    });

    await createNotification(
      tx,
      NotificationType.BDC_REJECTED,
      `Le bon de caisse ${bdc.bdcId} a été rejeté: ${rejectionReason}`,
      [bdc.userCreator.id],
      bdc.id
    );

    await logBDCEvent(tx, bdcId, userId, BDCEventType.REJECTED, { reason: rejectionReason });

    return bdc;
  });
}

export async function approveDAF(
  bdcId: number,
  userId: number,
  userRole: Role
) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { id: bdcId },
      include: {
        department: true
      }
    });

    if (!bdc) throw new Error("BDC introuvable");

    let newStatus: BDCStatus;
    let notificationType: NotificationType;
    let eventType: BDCEventType;
    let nextAction: Access[] = [];

    if(userRole !== Role.DAF) {
      throw new Error("Action reservée à la DAF");
    }else{
      newStatus = BDCStatus.APPROVED_DAF;
      notificationType = NotificationType.BDC_APPROVED_DAF;
      eventType = BDCEventType.APPROVED_DAF;
      nextAction = [Access.CASHIER];
    }

    // Update BDC
    const updatedBdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: {
        status: newStatus,
        approverDAFId: userId,
      },
    });

    // Find next approvers
    const nextApprovers = await tx.user.findMany({
      where: {
        access: { has: Access.CASHIER },
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    const nextApproverIds = nextApprovers.map(user => user.id);

    if (nextApproverIds.length > 0) {
      await createNotification(
        tx,
        notificationType,
        `Le bon de caisse ${bdc.bdcId} a été approuvé par la DAF`,
        nextApproverIds,
        bdc.id
      );
    }

    await logBDCEvent(tx, bdcId, userId, eventType);

    return updatedBdc;
  });
}


export async function markBDCAsPrinted(bdcId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    // First check if BDC exists and is in correct status
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { id: bdcId },
      include: {
        userCreator: true
      }
    });

    if (!bdc) {
      throw new Error("BDC introuvable");
    }

    if (bdc.status !== BDCStatus.APPROVED_DAF) {
      throw new Error("Le BDC doit être approuvé par la DAF avant l'impression");
    }

    // Check if already printed
    if (bdc.printedAt) {
      throw new Error("Ce BDC a déjà été imprimé");
    }

    // Update BDC status and record print details
    const updatedBdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: {
        status: BDCStatus.PRINTED,
        printedById: userId,
        printedAt: new Date(),
      },
      include: {
        userCreator: true,
        printedBy: true
      }
    });

    // Create notification for BDC creator
    await createNotification(
      tx,
      NotificationType.BDC_PRINTED,
      `Le bon de caisse (${bdc.bdcId}) a été décaissé par ${updatedBdc.printedBy?.name || 'le Service Achat'}`,
      [bdc.userCreator.id],
      bdc.id
    );

    // Log the print event
    await logBDCEvent(tx, bdcId, userId, BDCEventType.PRINTED, {
      printedAt: updatedBdc.printedAt,
      printedBy: updatedBdc.printedBy?.name
    });

    // Also notify relevant management roles
    const managementUsers = await tx.user.findMany({
      where: {
        role: {
          in: [Role.DAF, Role.ADMIN]
        },
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    if (managementUsers.length > 0) {
      await createNotification(
        tx,
        NotificationType.BDC_PRINTED,
        `${bdc.bdcId} a été décaissé par ${updatedBdc.printedBy?.name || 'le Service Achat'}`,
        managementUsers.map(u => u.id),
        bdc.id
      );
    }

    return updatedBdc;
  });
}

export async function updateBDC(
  bdcId: number,
  userId: number,
  data: Partial<CreateBDCInput>
) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { id: bdcId },
    });

    if (!bdc) throw new Error("BDC introuvable");
    if (bdc.status !== BDCStatus.SUBMITTED) {
      throw new Error("Seuls les BDC en attente peuvent être modifiés");
    }

    const updateData: any = { ...data };
    if (data.description) {
      updateData.totalAmount = data.description.reduce(
        (sum, item) => sum + item.amount,
        0
      );
    }

    const updatedBdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: updateData,
    });

    await logBDCEvent(tx, bdcId, userId, BDCEventType.UPDATED);

    return updatedBdc;
  });
}

export async function deleteBDC(bdcId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { id: bdcId },
    });

    if (!bdc) throw new Error("BDC introuvable");

    // First, find all notifications for this BDC
    const notifications = await tx.notification.findMany({
      where: { bonDeCaisseId: bdcId },
      select: { id: true }
    });

    const notificationIds = notifications.map(n => n.id);

    // Delete notification recipients first
    if (notificationIds.length > 0) {
      await tx.notificationRecipient.deleteMany({
        where: {
          notificationId: {
            in: notificationIds
          }
        }
      });
    }

    // Then delete the notifications
    await tx.notification.deleteMany({
      where: { bonDeCaisseId: bdcId },
    });

    // Delete audit logs
    await tx.bonDeCaisseAuditLog.deleteMany({
      where: { bonDeCaisseId: bdcId },
    });

    // Finally delete the BDC
    return tx.bonDeCaisse.delete({
      where: { id: bdcId },
    });
  });
}

export async function getBDCWithDetails(bdcId: string, userId: number, userRole: string) {
  const allowedRoles = [
    "ADMIN",
    "DIRECTEUR_GENERAL",
    "DAF",
    "MAGASINIER",
  ]; 
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.findUnique({
      where: { bdcId: bdcId },
      include: {
        department: true,
        creator: true,
        userCreator: true,
        approver: true,
        printedBy: true,
        auditLogs: {
          include: {
            user: true
          },
          orderBy: {
            eventAt: 'asc'
          }
        }
      }
    });

    if (!bdc) throw new Error("BDC introuvable");

    // if(bdc.creator.id !== userId || !allowedRoles.includes(userRole)){
    //   throw new Error("Accès interdit");
    // }

    return bdc;
  });

}