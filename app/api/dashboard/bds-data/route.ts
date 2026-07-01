import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import prisma from "@/lib/prisma";
import { Access, BDSStatus, BDSType, Role } from "@prisma/client";
import { getDateRange } from "../edb-data/utils/utils";

const FULL_ACCESS_ROLES = [
  Role.ADMIN,
  Role.DIRECTEUR_GENERAL,
  Role.GARDIEN,
  Role.AUDIT,
] as const;

function hasFullAccess(role: Role, access: string[]): boolean {
  return (
    FULL_ACCESS_ROLES.includes(role as (typeof FULL_ACCESS_ROLES)[number]) ||
    access.includes(Access.VIEW_ALL_BDS)
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const timeRange = searchParams.get("timeRange") || "this-month";
    const type = searchParams.get("type");

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: { employee: { include: { currentDepartment: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const dateRange = getDateRange(timeRange);

    let baseWhere: any = { createdAt: dateRange };

    if (!hasFullAccess(user.role as Role, user.access)) {
      const deptScopedRoles: Role[] = [
        Role.DIRECTEUR,
        Role.DAF,
        Role.DCM,
        Role.DOG,
        Role.DRH,
        Role.RESPONSABLE,
      ];

      if (deptScopedRoles.includes(user.role) && user.employee) {
        baseWhere.departmentId = user.employee.currentDepartmentId;
      } else {
        baseWhere.userCreatorId = user.id;
      }
    }

    if (type && type !== "all") {
      baseWhere.type = type as BDSType;
    }

    const [total, submitted, validated, completed] = await Promise.all([
      prisma.bonDeSortie.count({ where: baseWhere }),
      prisma.bonDeSortie.count({ where: { ...baseWhere, status: BDSStatus.SUBMITTED } }),
      prisma.bonDeSortie.count({ where: { ...baseWhere, status: BDSStatus.VALIDATED } }),
      prisma.bonDeSortie.count({
        where: { ...baseWhere, status: { in: [BDSStatus.COMPLETED, BDSStatus.RETURNED] } },
      }),
    ]);

    return NextResponse.json({
      metrics: { total, submitted, validated, completed },
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching BDS metrics:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des métriques" }, { status: 500 });
  }
}
