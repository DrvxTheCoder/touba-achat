import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth-options";
import {
  createBDS,
  validateBDS,
  rejectBDS,
  completeBDS,
  returnBDS,
  recordPartialReturn,
  updateBDS,
  deleteBDS,
  getBDSWithDetails,
} from "@/app/api/bds/utils/bds-util";
import { Access, BDSType, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const employeeInfoSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "Le rôle est requis"),
});

const bdsItemSchema = z.object({
  quantite: z.number().positive("La quantité doit être positive"),
  designation: z.string().min(1, "La désignation est requise"),
  observations: z.string().optional(),
});

const createBDSSchema = z.object({
  type: z.enum(["PERSONNEL", "MATERIEL"]),
  motif: z.string().min(1, "Le motif est requis"),
  destination: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  heureSortie: z.string().optional(),
  heureRetour: z.string().optional(),
  comment: z.string().optional(),
  employees: z.array(employeeInfoSchema).optional(),
  vehicule: z.string().optional(),
  chauffeur: z.string().optional(),
  items: z.array(bdsItemSchema).optional(),
  nombreColis: z.number().int().optional(),
  isReturnable: z.boolean().optional(),
});

const updateBDSSchema = createBDSSchema.partial();

const rejectBDSSchema = z.object({
  reason: z.string().min(1, "La raison du rejet est requise"),
});

const completeSchema = z.object({
  heureSortieEffective: z.string().optional(),
});

const returnItemSchema = z.object({
  designation: z.string().min(1),
  quantiteRetournee: z.number().min(0),
});

const returnSchema = z.object({
  heureRetourEffective: z.string().optional(),
  returnedItems: z.array(returnItemSchema).optional(),
});

const partialReturnSchema = z.object({
  returnedItems: z.array(returnItemSchema).min(1, "Au moins un article est requis"),
});

const VALIDATOR_ROLES: string[] = [
  Role.ADMIN,
  Role.DIRECTEUR_GENERAL,
  Role.DIRECTEUR,
  Role.DAF,
  Role.DCM,
  Role.DOG,
  Role.DRH,
];

function canValidate(userRole: string, userAccess: string[]): boolean {
  return VALIDATOR_ROLES.includes(userRole) || userAccess.includes(Access.APPROVE_BDS);
}

function getTimeRangeFilter(timeRange: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  switch (timeRange) {
    case "today":
      return { gte: today, lte: now };
    case "this-week": {
      const monday = new Date(today);
      monday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return { gte: monday, lte: now };
    }
    case "this-month":
      return { gte: startOfMonth };
    case "last-month": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { gte: lastMonth, lte: endOfLastMonth };
    }
    case "last-3-months":
      return { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) };
    case "this-year":
      return { gte: startOfYear };
    case "last-year": {
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear(), 0, 0);
      return { gte: lastYear, lte: endOfLastYear };
    }
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await req.json();
    const validatedData = createBDSSchema.parse(data);

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employee: true },
    });

    if (!user?.employee) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (user.role === Role.GARDIEN) {
      return NextResponse.json({ error: "Les gardiens ne peuvent pas créer de BDS" }, { status: 403 });
    }

    if (validatedData.type === "MATERIEL" && !user.access.includes(Access.CREATE_BDS_MATERIEL)) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à créer un BDS Matériel" },
        { status: 403 }
      );
    }

    const bds = await createBDS({
      ...validatedData,
      type: validatedData.type as BDSType,
      date: new Date(validatedData.date),
      departmentId: user.employee.currentDepartmentId,
      creatorId: user.employee.id,
      userCreatorId: user.id,
    });

    return NextResponse.json(bds);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    console.error("BDS creation error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du BDS" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bdsId = searchParams.get("id");
    const action = searchParams.get("action");

    if (!bdsId) {
      return NextResponse.json({ error: "ID du BDS manquant" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const bdsIdNum = parseInt(bdsId);

    switch (action) {
      case "validate": {
        if (!canValidate(user.role, user.access)) {
          return NextResponse.json({ error: "Non autorisé pour valider" }, { status: 403 });
        }
        const result = await validateBDS(bdsIdNum, user.id);
        return NextResponse.json(result);
      }

      case "reject": {
        if (!canValidate(user.role, user.access)) {
          return NextResponse.json({ error: "Non autorisé pour rejeter" }, { status: 403 });
        }
        const body = await req.json();
        const { reason } = rejectBDSSchema.parse(body);
        const result = await rejectBDS(bdsIdNum, user.id, reason);
        return NextResponse.json(result);
      }

      case "complete": {
        if (user.role !== Role.GARDIEN) {
          return NextResponse.json({ error: "Action réservée aux gardiens" }, { status: 403 });
        }
        const body = await req.json();
        const { heureSortieEffective } = completeSchema.parse(body);
        const result = await completeBDS(bdsIdNum, user.id, heureSortieEffective);
        return NextResponse.json(result);
      }

      case "return": {
        if (user.role !== Role.GARDIEN) {
          return NextResponse.json({ error: "Action réservée aux gardiens" }, { status: 403 });
        }
        const body = await req.json();
        const { heureRetourEffective, returnedItems } = returnSchema.parse(body);
        const result = await returnBDS(bdsIdNum, user.id, heureRetourEffective, returnedItems);
        return NextResponse.json(result);
      }

      case "partial-return": {
        if (user.role !== Role.GARDIEN) {
          return NextResponse.json({ error: "Action réservée aux gardiens" }, { status: 403 });
        }
        const body = await req.json();
        const { returnedItems } = partialReturnSchema.parse(body);
        const result = await recordPartialReturn(bdsIdNum, user.id, returnedItems);
        return NextResponse.json(result);
      }

      case "update": {
        const body = await req.json();
        const validatedData = updateBDSSchema.parse(body);
        const result = await updateBDS(bdsIdNum, user.id, {
          ...validatedData,
          type: validatedData.type as BDSType | undefined,
          date: validatedData.date ? new Date(validatedData.date) : undefined,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: "Action non valide" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 });
    }
    console.error("BDS update error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du BDS" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bdsId = searchParams.get("id");

    if (!bdsId) {
      return NextResponse.json({ error: "ID du BDS manquant" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(session.user.id) } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const bds = await prisma.bonDeSortie.findUnique({ where: { id: parseInt(bdsId) } });
    if (!bds) {
      return NextResponse.json({ error: "BDS non trouvé" }, { status: 404 });
    }

    if (user.role !== Role.ADMIN && bds.userCreatorId !== user.id) {
      return NextResponse.json({ error: "Non autorisé pour supprimer" }, { status: 403 });
    }

    await deleteBDS(parseInt(bdsId), user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BDS deletion error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression du BDS" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bdsId = searchParams.get("id");

    if (bdsId) {
      const bds = await getBDSWithDetails(bdsId);
      if (!bds) return NextResponse.json({ error: "BDS non trouvé" }, { status: 404 });
      return NextResponse.json(bds);
    }

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "5");
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search") || "";
    const timeRange = searchParams.get("timeRange") || "";
    const department = searchParams.get("department");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employee: true },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

    let whereClause: any = {};

    const hasFullAccess =
      user.role === Role.ADMIN ||
      user.role === Role.DIRECTEUR_GENERAL ||
      user.role === Role.GARDIEN ||
      user.access.includes(Access.VIEW_ALL_BDS);

    if (!hasFullAccess) {
      const deptScopedRoles: string[] = [
        Role.DIRECTEUR,
        Role.DAF,
        Role.DCM,
        Role.DOG,
        Role.DRH,
        Role.RESPONSABLE,
      ];

      if (deptScopedRoles.includes(user.role) && user.employee) {
        whereClause.departmentId = user.employee.currentDepartmentId;
      } else {
        whereClause.userCreatorId = user.id;
      }
    }

    if (department && department !== "all") {
      whereClause.departmentId = parseInt(department);
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (type && type !== "all") {
      whereClause.type = type;
    }

    if (timeRange) {
      const timeRangeFilter = getTimeRangeFilter(timeRange);
      if (timeRangeFilter) {
        whereClause.createdAt = timeRangeFilter;
      }
    }

    if (search) {
      whereClause.OR = [
        { bdsId: { contains: search, mode: "insensitive" } },
        { motif: { contains: search, mode: "insensitive" } },
        { creator: { name: { contains: search, mode: "insensitive" } } },
        { department: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [bdsList, total] = await prisma.$transaction([
      prisma.bonDeSortie.findMany({
        where: whereClause,
        include: {
          department: true,
          creator: true,
          userCreator: true,
          validator: true,
          rejector: true,
          completedBy: true,
          returnedBy: true,
          auditLogs: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.bonDeSortie.count({ where: whereClause }),
    ]);

    return NextResponse.json({ data: bdsList, total, page, pageSize });
  } catch (error) {
    console.error("BDS fetch error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des BDS" }, { status: 500 });
  }
}
