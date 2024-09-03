import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const odmId = params.id;

        // Fetch the ODM with related data
        const odm = await prisma.ordreDeMission.findUnique({
            where: { odmId: odmId },
            include: {
                creator: {
                    include: {
                        user: true
                    }
                },
                userCreator: true,
                department: true,
                approver: true,
                rhProcessor: true,
                auditLogs: {
                    include: {
                        user: true
                    },
                    orderBy: {
                        eventAt: 'desc'
                    }
                }
            }
        });

        if (!odm) {
            return NextResponse.json({ error: 'ODM non trouvé' }, { status: 404 });
        }

        const userRole = session.user.role;
        const userId = parseInt(session.user.id);

        if (userRole === 'RESPONSABLE' && odm.userCreatorId !== userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
        }

        if (userRole === 'DIRECTEUR') {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { employee: true }
            });
            if (user?.employee?.currentDepartmentId !== odm.departmentId) {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
            }
        }

        const odmWithSafeAuditLogs = {
            ...odm,
            auditLogs: odm.auditLogs || []
        };

        return NextResponse.json(odmWithSafeAuditLogs);

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ODM:', error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}