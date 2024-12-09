// app/api/bdc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth-options";
import { 
  createBDC, 
  updateBDC, 
  submitBDC, 
  approveBDC,
  rejectBDC,
  deleteBDC,
  markBDCAsPrinted,
  getBDCWithDetails
} from "@/app/api/bdc/utils/bdc-util";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const expenseItemSchema = z.object({
  item: z.string().min(1, "L'article est requis"),
  amount: z.number().positive("Le montant doit être positif")
});

const employeeInfoSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "Le rôle est requis")
});

const createBDCSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.array(expenseItemSchema).min(1, "Au moins un article est requis"),
  employees: z.array(employeeInfoSchema).optional(),
  comment: z.string().optional(),
});

const updateBDCSchema = createBDCSchema.partial();

const rejectBDCSchema = z.object({
  reason: z.string().min(1, "La raison du rejet est requise")
});

export async function POST(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
  
      const data = await req.json();
      const validatedData = createBDCSchema.parse(data); // Only validate the form data
  
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: {
          employee: true
        }
      });
  
      if (!user?.employee) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }
  
      // Add departmentId after validation
      const bdc = await createBDC({
        ...validatedData,
        departmentId: user.employee.currentDepartmentId,
        creatorId: user.employee.id,
        userCreatorId: user.id
      });
  
      return NextResponse.json(bdc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Données invalides", details: error.errors },
          { status: 400 }
        );
      }
      console.error("BDC creation error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création du BDC" },
        { status: 500 }
      );
    }
  }

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bdcId = searchParams.get("id");
    const action = searchParams.get("action");

    if (!bdcId) {
      return NextResponse.json({ error: "ID du BDC manquant" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const bdcIdNum = parseInt(bdcId);

    switch (action) {
      case "update": {
        const data = await req.json();
        const validatedData = updateBDCSchema.parse(data);
        const updatedBdc = await updateBDC(bdcIdNum, user.id, validatedData);
        return NextResponse.json(updatedBdc);
      }

      case "approve": {
        if (!['RESPONSABLE', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'DOG', 'DAF'].includes(user.role as Role)) {
          return NextResponse.json({ error: "Non autorisé pour approuver" }, { status: 403 });
        }
        const approvedBdc = await approveBDC(bdcIdNum, user.id, user.role);
        return NextResponse.json(approvedBdc);
      }

      case "reject": {
        if (!['RESPONSABLE', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'DOG', 'DAF'].includes(user.role as Role)) {
          return NextResponse.json({ error: "Non autorisé pour rejeter" }, { status: 403 });
        }
        const data = await req.json();
        const { reason } = rejectBDCSchema.parse(data);
        const rejectedBdc = await rejectBDC(bdcIdNum, user.id, reason);
        return NextResponse.json(rejectedBdc);
      }

      case "print": {
        if (user.role !== Role.DAF) {
          return NextResponse.json({ error: "Action reservé DAF" }, { status: 403 });
        }
        const printedBdc = await markBDCAsPrinted(bdcIdNum, user.id);
        return NextResponse.json(printedBdc);
      }

      default:
        return NextResponse.json({ error: "Action non valide" }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    console.error("BDC update error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du BDC" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bdcId = searchParams.get("id");

    if (!bdcId) {
      return NextResponse.json({ error: "ID du BDC manquant" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Only allow delete if user is admin or creator of the BDC
    const bdc = await prisma.bonDeCaisse.findUnique({
      where: { id: parseInt(bdcId) }
    });

    if (!bdc) {
      return NextResponse.json({ error: "BDC non trouvé" }, { status: 404 });
    }

    if (user.role !== Role.ADMIN && bdc.userCreatorId !== user.id) {
      return NextResponse.json({ error: "Non autorisé pour supprimer" }, { status: 403 });
    }

    await deleteBDC(parseInt(bdcId), user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BDC deletion error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du BDC" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
   
      const { searchParams } = new URL(req.url);
      const bdcId = searchParams.get("id");
   
      if (bdcId) {
        const bdc = await getBDCWithDetails(parseInt(bdcId));
        if (!bdc) return NextResponse.json({ error: "BDC non trouvé" }, { status: 404 });
        return NextResponse.json(bdc);
      }
   
      const page = parseInt(searchParams.get("page") || "1");
      const pageSize = parseInt(searchParams.get("pageSize") || "5");
      const skip = (page - 1) * pageSize;
      const search = searchParams.get("search");
   
      const user = await prisma.user.findUnique({
        where: { id: parseInt(session.user.id) },
        include: { employee: true }
      });
   
      if (!user) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
   
      let whereClause: any = {};
   
      if (!['ADMIN', 'DAF', 'DIRECTEUR_GENERAL'].includes(user.role)) {
        if (user.employee) {
          whereClause.departmentId = user.employee.currentDepartmentId;
        }
      }
   
      if (search) {
        whereClause.OR = [
          { bdcId: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { department: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
   
      const [bdcs, total] = await prisma.$transaction([
        prisma.bonDeCaisse.findMany({
          where: whereClause,
          include: {
            department: true,
            creator: true,
            approver: true,
            printedBy: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        }),
        prisma.bonDeCaisse.count({ where: whereClause })
      ]);
   
      return NextResponse.json({ data: bdcs, total, page, pageSize });
   
    } catch (error) {
      console.error("BDC fetch error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des BDCs" },
        { status: 500 }
      );
    }
   }