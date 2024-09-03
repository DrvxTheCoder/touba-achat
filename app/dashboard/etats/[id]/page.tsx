// app/dashboard/etats/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EtatsSingle } from '../components/EtatsSingle';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

async function getEDB(edbId: string) {
  const edb = await prisma.etatDeBesoin.findUnique({
    where: { edbId: edbId },
    include: {
      creator: {
        include: {
          user: true,
          currentDepartment: true
        }
      },
      userCreator: true,
      department: true,
      category: true,
      attachments: {
        orderBy: {
          uploadedAt: 'desc'
        }
      },
      finalSupplier: {
        include: {
          chooser: true
        }
      },
      approver: true,
      itApprover: true,
      finalApprover: true,
      auditLogs: {
        include: {
          user: true
        },
        orderBy: {
          eventAt: 'desc'
        }
      },
      orders: true
    }
  });

  if (!edb) {
    notFound();
  }

  return edb;
}

async function checkAccess(session: any) {
  const allowedReadRoles = [
    "ADMIN",
    "DIRECTEUR",
    "DIRECTEUR_GENERAL",
    "RESPONSABLE",
    "MAGASINIER",
    "AUDIT",
    "IT_ADMIN"
  ];

  return session?.user?.role && allowedReadRoles.includes(session.user.role);
}

export default async function EDBPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  const hasAccess = await checkAccess(session);

  if (!hasAccess) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mb-4">
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
    const edb = await getEDB(params.id);
    return <EtatsSingle edb={edb} />;
  } catch (error) {
    console.error('Error in EDBPage:', error);
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">Erreur</h3>
          <p className="text-sm text-muted-foreground">
          Erreur lors du chargement de l&apos;EDB : {(error as Error).message}.
          </p>
        </div>
      </div>
    </main>
    );
  }
}