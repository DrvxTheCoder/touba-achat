import { prisma } from "@/lib/prisma";
import { BDCEventType, BDCStatus, NotificationType, Role } from "@prisma/client";

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
  employees: EmployeeInfo[];
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
  recipientIds: number[],
  bdcId?: number
) {
  const notification = await tx.notification.create({
    data: {
      type,
      message,
      bonDeCaisseId: bdcId,
      recipients: {
        create: recipientIds.map(userId => ({
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
      // Create the BDC first
      const bdc = await tx.bonDeCaisse.create({
        data: {
          bdcId,
          title: input.title,
          description: input.description,
          employees: input.employees,
          comment: input.comment,
          totalAmount,
          departmentId: input.departmentId,
          creatorId: input.creatorId,
          userCreatorId: input.userCreatorId,
          status: BDCStatus.SUBMITTED,
        },
      });
  
      // Create audit log within the same transaction
      await logBDCEvent(tx, bdc.id, input.userCreatorId, BDCEventType.SUBMITTED);
  
      // Find responsables in the department
      const responsables = await tx.employee.findMany({
        where: {
          currentDepartmentId: input.departmentId,
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
          `Nouveau bon de caisse ${bdcId} à valider`,
          responsableIds,
          bdc.id
        );
      }
  
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

export async function markBDCAsPrinted(bdcId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const bdc = await tx.bonDeCaisse.update({
      where: { id: bdcId },
      data: {
        status: BDCStatus.PRINTED,
        printedById: userId,
        printedAt: new Date(),
      },
      include: {
        userCreator: true
      }
    });

    await createNotification(
      tx,
      NotificationType.BDC_PRINTED,
      `Le bon de caisse ${bdc.bdcId} a été imprimé`,
      [bdc.userCreator.id],
      bdc.id
    );

    await logBDCEvent(tx, bdcId, userId, BDCEventType.PRINTED);

    return bdc;
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
    if (bdc.status !== BDCStatus.SUBMITTED) {
      throw new Error("Seuls les BDC en attente peuvent être supprimés");
    }

    // Delete associated notifications
    await tx.notification.deleteMany({
      where: { bonDeCaisseId: bdcId },
    });

    // Delete audit logs
    await tx.bonDeCaisseAuditLog.deleteMany({
      where: { bonDeCaisseId: bdcId },
    });

    // Delete the BDC
    return tx.bonDeCaisse.delete({
      where: { id: bdcId },
    });
  });
}

export async function getBDCWithDetails(bdcId: number) {
  return prisma.bonDeCaisse.findUnique({
    where: { id: bdcId },
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
}