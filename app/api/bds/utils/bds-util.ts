import { prisma } from "@/lib/prisma";
import { Access, BDSEventType, BDSStatus, BDSType, NotificationType, Role } from "@prisma/client";

type BDSEmployeeInfo = {
  name: string;
  role: string;
};

type BDSItem = {
  quantite: number;
  designation: string;
  observations?: string;
};

type CreateBDSInput = {
  type: BDSType;
  motif: string;
  destination?: string;
  date: Date;
  heureSortie?: string;
  heureRetour?: string;
  comment?: string;
  employees?: BDSEmployeeInfo[];
  vehicule?: string;
  chauffeur?: string;
  items?: BDSItem[];
  nombreColis?: number;
  isReturnable?: boolean;
  departmentId: number;
  creatorId: number;
  userCreatorId: number;
};

async function getLatestBDSNumber(): Promise<number> {
  const currentYear = new Date().getFullYear();
  const prefix = `BDS-${currentYear}-`;

  const latestBDS = await prisma.bonDeSortie.findFirst({
    where: {
      bdsId: { startsWith: prefix },
    },
    orderBy: { bdsId: "desc" },
    select: { bdsId: true },
  });

  if (!latestBDS) return 0;

  const parts = latestBDS.bdsId.split("-");
  const number = parseInt(parts[2], 10);
  return isNaN(number) ? 0 : number;
}

async function generateBDSId(retryCount = 0): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    const latestNumber = await getLatestBDSNumber();
    const nextNumber = latestNumber + 1;
    const bdsId = `BDS-${currentYear}-${nextNumber.toString().padStart(3, "0")}`;

    const existing = await prisma.bonDeSortie.findUnique({ where: { bdsId } });
    if (existing && retryCount < 3) {
      return generateBDSId(retryCount + 1);
    } else if (retryCount >= 3) {
      throw new Error("Impossible de générer un ID unique après 3 tentatives");
    }

    return bdsId;
  } catch (error) {
    if (retryCount < 3) return generateBDSId(retryCount + 1);
    throw error;
  }
}

export { generateBDSId };

async function createNotification(
  tx: any,
  type: NotificationType,
  message: string,
  recipientIds?: number[],
  bdsId?: number
) {
  return tx.notification.create({
    data: {
      type,
      message,
      bonDeSortieId: bdsId,
      recipients: {
        create: recipientIds?.map((userId) => ({
          user: { connect: { id: userId } },
        })),
      },
    },
  });
}

async function logBDSEvent(
  tx: any,
  bdsId: number,
  userId: number,
  eventType: BDSEventType,
  details?: any
) {
  return tx.bonDeSortieAuditLog.create({
    data: {
      bonDeSortieId: bdsId,
      userId,
      eventType,
      details: details || undefined,
    },
  });
}

const AUTO_VALIDATED_ROLES: Role[] = [
  Role.DIRECTEUR,
  Role.DAF,
  Role.DCM,
  Role.DOG,
  Role.DRH,
  Role.DIRECTEUR_GENERAL,
  Role.ADMIN,
];

export async function createBDS(input: CreateBDSInput) {
  const bdsId = await generateBDSId();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: input.userCreatorId } });
    if (!user) throw new Error("Utilisateur non trouvé");

    const autoValidate =
      user.access.includes(Access.APPROVE_BDS) ||
      AUTO_VALIDATED_ROLES.includes(user.role as Role);

    const initialStatus: BDSStatus = autoValidate ? BDSStatus.VALIDATED : BDSStatus.SUBMITTED;

    const bds = await tx.bonDeSortie.create({
      data: {
        bdsId,
        type: input.type,
        motif: input.motif,
        destination: input.destination,
        date: input.date,
        heureSortie: input.heureSortie,
        heureRetour: input.heureRetour,
        comment: input.comment,
        employees: input.employees || undefined,
        vehicule: input.vehicule,
        chauffeur: input.chauffeur,
        items: input.items || undefined,
        nombreColis: input.nombreColis,
        isReturnable: input.type === "MATERIEL" ? (input.isReturnable ?? true) : true,
        status: initialStatus,
        departmentId: input.departmentId,
        creatorId: input.creatorId,
        userCreatorId: input.userCreatorId,
        validatorId: autoValidate ? input.userCreatorId : undefined,
      },
    });

    if (autoValidate) {
      await createNotification(
        tx,
        NotificationType.BDS_VALIDATED,
        `Bon de sortie ${bdsId} validé automatiquement - ${user.name}`,
        undefined,
        bds.id
      );
    } else {
      // Find validators in the department
      const validators = await tx.employee.findMany({
        where: {
          currentDepartmentId: input.departmentId,
          user: {
            OR: [
              { role: { in: AUTO_VALIDATED_ROLES } },
              { access: { has: Access.APPROVE_BDS } },
            ],
            status: "ACTIVE",
          },
        },
        select: { user: { select: { id: true } } },
      });

      const validatorIds = validators.map((e) => e.user.id);

      if (validatorIds.length > 0) {
        await createNotification(
          tx,
          NotificationType.BDS_CREATED,
          `Nouveau bon de sortie ${bdsId} à valider - ${user.name}`,
          validatorIds,
          bds.id
        );
      }
    }

    await logBDSEvent(tx, bds.id, input.userCreatorId, BDSEventType.SUBMITTED);

    return bds;
  });
}

export async function validateBDS(bdsId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId }, include: { userCreator: true } });
    if (!bds) throw new Error("BDS introuvable");
    if (bds.status !== BDSStatus.SUBMITTED) throw new Error("Ce BDS ne peut pas être validé dans son état actuel");

    const updated = await tx.bonDeSortie.update({
      where: { id: bdsId },
      data: { status: BDSStatus.VALIDATED, validatorId: userId },
    });

    await createNotification(
      tx,
      NotificationType.BDS_VALIDATED,
      `Votre bon de sortie ${bds.bdsId} a été validé`,
      [bds.userCreatorId],
      bds.id
    );

    await logBDSEvent(tx, bdsId, userId, BDSEventType.VALIDATED);

    return updated;
  });
}

export async function rejectBDS(bdsId: number, userId: number, rejectionReason: string) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId }, include: { userCreator: true } });
    if (!bds) throw new Error("BDS introuvable");
    if (bds.status !== BDSStatus.SUBMITTED) throw new Error("Ce BDS ne peut pas être rejeté dans son état actuel");

    const updated = await tx.bonDeSortie.update({
      where: { id: bdsId },
      data: { status: BDSStatus.REJECTED, rejectorId: userId, rejectionReason },
    });

    await createNotification(
      tx,
      NotificationType.BDS_REJECTED,
      `Votre bon de sortie ${bds.bdsId} a été rejeté: ${rejectionReason}`,
      [bds.userCreatorId],
      bds.id
    );

    await logBDSEvent(tx, bdsId, userId, BDSEventType.REJECTED, { reason: rejectionReason });

    return updated;
  });
}

export async function completeBDS(bdsId: number, userId: number, heureSortieEffective?: string) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId } });
    if (!bds) throw new Error("BDS introuvable");
    if (bds.status !== BDSStatus.VALIDATED) throw new Error("Le BDS doit être validé avant de marquer la sortie");

    const effectiveTime =
      heureSortieEffective ||
      new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const updated = await tx.bonDeSortie.update({
      where: { id: bdsId },
      data: {
        status: BDSStatus.COMPLETED,
        completedById: userId,
        completedAt: new Date(),
        heureSortieEffective: effectiveTime,
      },
    });

    await createNotification(
      tx,
      NotificationType.BDS_COMPLETED,
      `La sortie pour le bon ${bds.bdsId} a été confirmée à ${effectiveTime}`,
      [bds.userCreatorId],
      bds.id
    );

    await logBDSEvent(tx, bdsId, userId, BDSEventType.COMPLETED, { heureSortieEffective: effectiveTime });

    return updated;
  });
}

type ReturnItem = { designation: string; quantiteRetournee: number };

type ReturnHistoryEntry = {
  items: ReturnItem[];
  returnedAt: string;
  returnedById: number;
  heureRetour?: string;
};

function computeTotalReturned(history: ReturnHistoryEntry[]): Record<string, number> {
  return history.reduce<Record<string, number>>((acc, entry) => {
    for (const item of entry.items) {
      acc[item.designation] = (acc[item.designation] || 0) + item.quantiteRetournee;
    }
    return acc;
  }, {});
}

function checkFullyReturned(
  originalItems: BDSItem[],
  history: ReturnHistoryEntry[]
): boolean {
  const totals = computeTotalReturned(history);
  return originalItems.every((item) => (totals[item.designation] || 0) >= item.quantite);
}

export async function returnBDS(
  bdsId: number,
  userId: number,
  heureRetourEffective?: string,
  returnedItems?: ReturnItem[]
) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId } });
    if (!bds) throw new Error("BDS introuvable");
    if (bds.status !== BDSStatus.COMPLETED) throw new Error("Le BDS doit être en statut Sorti avant de marquer le retour");
    if (!bds.heureRetour) throw new Error("Le retour ne peut être enregistré que si une heure de retour prévue était définie");

    const effectiveTime =
      heureRetourEffective ||
      new Date().toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

    // Build initial return history entry — only for returnable MATERIEL BDS
    let returnHistory: ReturnHistoryEntry[] = [];
    let isFullyReturned = false;

    if (bds.type === "MATERIEL" && bds.isReturnable) {
      if (returnedItems && returnedItems.length > 0) {
        const entry: ReturnHistoryEntry = {
          items: returnedItems.filter((i) => i.quantiteRetournee > 0),
          returnedAt: new Date().toISOString(),
          returnedById: userId,
          heureRetour: effectiveTime,
        };
        returnHistory = [entry];

        const originalItems = (bds.items ?? []) as BDSItem[];
        isFullyReturned = checkFullyReturned(originalItems, returnHistory);
      }
      // isFullyReturned stays false until all items are accounted for via partial returns
    } else {
      // PERSONNEL BDS or non-returnable MATERIEL: no quantity tracking, mark as fully returned
      isFullyReturned = true;
    }

    const updated = await tx.bonDeSortie.update({
      where: { id: bdsId },
      data: {
        status: BDSStatus.RETURNED,
        returnedById: userId,
        returnedAt: new Date(),
        heureRetourEffective: effectiveTime,
        returnHistory: returnHistory.length > 0 ? returnHistory : undefined,
        isFullyReturned,
      },
    });

    await createNotification(
      tx,
      NotificationType.BDS_RETURNED,
      `Le retour pour le bon ${bds.bdsId} a été confirmé à ${effectiveTime}`,
      [bds.userCreatorId],
      bds.id
    );

    await logBDSEvent(tx, bdsId, userId, BDSEventType.RETURNED, {
      heureRetourEffective: effectiveTime,
      isFullyReturned,
    });

    return updated;
  });
}

export async function recordPartialReturn(
  bdsId: number,
  userId: number,
  returnedItems: ReturnItem[]
) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId } });
    if (!bds) throw new Error("BDS introuvable");
    if (bds.status !== BDSStatus.RETURNED) throw new Error("Le BDS doit être en statut Retourné pour enregistrer un retour partiel");
    if (bds.type !== "MATERIEL") throw new Error("Le suivi de retour par article n'est disponible que pour les BDS Matériel");
    if (!bds.isReturnable) throw new Error("Ce BDS est marqué comme non retournable — le suivi par article n'est pas applicable");
    if (bds.isFullyReturned) throw new Error("Tous les articles ont déjà été retournés");

    const originalItems = (bds.items ?? []) as BDSItem[];
    const existingHistory = ((bds.returnHistory ?? []) as ReturnHistoryEntry[]);
    const alreadyReturned = computeTotalReturned(existingHistory);

    // Validate quantities don't exceed remaining
    for (const item of returnedItems) {
      if (item.quantiteRetournee <= 0) continue;
      const original = originalItems.find((o) => o.designation === item.designation);
      if (!original) throw new Error(`Article introuvable: ${item.designation}`);
      const remaining = original.quantite - (alreadyReturned[item.designation] || 0);
      if (item.quantiteRetournee > remaining) {
        throw new Error(
          `Quantité invalide pour "${item.designation}". Maximum restant: ${remaining}`
        );
      }
    }

    const newEntry: ReturnHistoryEntry = {
      items: returnedItems.filter((i) => i.quantiteRetournee > 0),
      returnedAt: new Date().toISOString(),
      returnedById: userId,
    };

    const updatedHistory = [...existingHistory, newEntry];
    const isFullyReturned = checkFullyReturned(originalItems, updatedHistory);

    const updated = await tx.bonDeSortie.update({
      where: { id: bdsId },
      data: {
        returnHistory: updatedHistory,
        isFullyReturned,
      },
    });

    await logBDSEvent(tx, bdsId, userId, BDSEventType.RETURNED, {
      partialReturn: true,
      items: newEntry.items,
      isFullyReturned,
    });

    return updated;
  });
}

export async function updateBDS(bdsId: number, userId: number, data: Partial<CreateBDSInput>) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId } });
    if (!bds) throw new Error("BDS introuvable");
    if (bds.status !== BDSStatus.SUBMITTED) throw new Error("Seuls les BDS en attente peuvent être modifiés");

    const updated = await tx.bonDeSortie.update({
      where: { id: bdsId },
      data: { ...data },
    });

    await logBDSEvent(tx, bdsId, userId, BDSEventType.UPDATED);

    return updated;
  });
}

export async function deleteBDS(bdsId: number, userId: number) {
  return prisma.$transaction(async (tx) => {
    const bds = await tx.bonDeSortie.findUnique({ where: { id: bdsId } });
    if (!bds) throw new Error("BDS introuvable");

    const notifications = await tx.notification.findMany({
      where: { bonDeSortieId: bdsId },
      select: { id: true },
    });

    const notificationIds = notifications.map((n) => n.id);

    if (notificationIds.length > 0) {
      await tx.notificationRecipient.deleteMany({
        where: { notificationId: { in: notificationIds } },
      });
    }

    await tx.notification.deleteMany({ where: { bonDeSortieId: bdsId } });
    await tx.bonDeSortieAuditLog.deleteMany({ where: { bonDeSortieId: bdsId } });

    return tx.bonDeSortie.delete({ where: { id: bdsId } });
  });
}

export async function getBDSWithDetails(bdsId: string) {
  return prisma.bonDeSortie.findUnique({
    where: { bdsId },
    include: {
      department: true,
      creator: true,
      userCreator: true,
      validator: true,
      rejector: true,
      completedBy: true,
      returnedBy: true,
      auditLogs: {
        include: { user: true },
        orderBy: { eventAt: "asc" },
      },
    },
  });
}
