// app/dashboard/odm/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ODMSingle } from '../components/ODMSingle';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

async function getODM(odmId: string) {
  const odm = await prisma.ordreDeMission.findUnique({
    where: { odmId: odmId },
    include: {
      creator: {
        include: {
          user: true,
          currentDepartment: true
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
    notFound();
  }
  return odm;
}

async function checkAccess(session: any) {
  const allowedReadRoles = [
    "ADMIN",
    "DIRECTEUR",
    "DIRECTEUR_GENERAL",
    "RESPONSABLE",
    "RH",
    "AUDIT"
  ];

  return session?.user?.role && allowedReadRoles.includes(session.user.role);
}

export default async function ODMPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  const hasAccess = await checkAccess(session);

  if (!hasAccess) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Accès interdit</h3>
            <p className="text-sm text-muted-foreground">
              Vous n&apos;avez pas les permissions nécessaires pour accéder à ce contenu.
            </p>
          </div>
        </div>
      </main>
    );
  }

  try {
    const odm = await getODM(params.id);
    return <ODMSingle odm={odm} userRole={session.user.role} />;
  } catch (error) {
    console.error('Error in ODMPage:', error);
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Erreur</h3>
            <p className="text-sm text-muted-foreground">
              Erreur lors du chargement de l&apos;ODM : {(error as Error).message}.
            </p>
          </div>
        </div>
      </main>
    );
  }
}

