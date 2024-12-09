// app/dashboard/odm/[id]/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ODMSingle } from '../components/ODMSingle';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { ContentLayout } from "@/components/user-panel/content-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import DynamicBreadcrumbs from '@/components/DynamicBreadcrumbs';

const UnauthorizedContent = () => (
  <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <div className="flex items-center">
      <h1 className="text-lg font-semibold md:text-2xl">Non-autorisé</h1>
    </div>
    <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Accès interdit
        </h3>
        <p className="text-sm text-muted-foreground">
          Vous n&apos;avez pas les permissions nécessaires pour accéder à ce contenu.
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/dashboard/odm">Retour aux ordres de missions</Link>
        </Button>
      </div>
    </div>
  </main>
);

const NotFoundContent = ({ id }: { id: string }) => (
  <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <div className="flex items-center">
      <h1 className="text-lg font-semibold md:text-2xl">Non trouvé</h1>
    </div>
    <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
      <div className="flex flex-col items-center gap-4 text-center">
        <FileQuestion className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight">
          Ordre de mission introuvable
        </h3>
        <p className="text-sm text-muted-foreground">
          L&apos;ordre de mission avec l&apos;identifiant {id} n&apos;existe pas ou a été supprimé.
        </p>
        <Button className="mt-2" variant="outline" asChild>
          <Link href="/dashboard/odm">Retour aux ordres de missions</Link>
        </Button>
      </div>
    </div>
  </main>
);

const ErrorContent = ({ error }: { error: Error }) => (
  <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
    <div className="flex items-center">
      <h1 className="text-lg font-semibold md:text-2xl">Erreur</h1>
    </div>
    <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">
          Une erreur est survenue
        </h3>
        <p className="text-sm text-muted-foreground">
          Erreur lors du chargement de l&apos;ODM : {error.message}
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/dashboard/odm">Retour aux ordres de missions</Link>
        </Button>
      </div>
    </div>
  </main>
);

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
  return odm;
}

async function checkAccess(session: any) {
  const allowedReadRoles = [
    "ADMIN",
    "DIRECTEUR",
    "DIRECTEUR_GENERAL",
    "RESPONSABLE",
    "RH",
    "AUDIT",
    "DAF",
    "DOG",
    "DRH",
    "DCM",
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
      <ContentLayout title="Non-autorisé">
        <UnauthorizedContent />
      </ContentLayout>
    );
  }

  try {
    const odm = await getODM(params.id);
    
    if (!odm) {
      return (
        <ContentLayout title="Non trouvé">
          <NotFoundContent id={params.id} />
        </ContentLayout>
      );
    }

    return (
      <ContentLayout title={`Ordre de Mission - ${odm.odmId}`}>
        <DynamicBreadcrumbs />
        <ODMSingle odm={odm} userRole={session.user.role} />
      </ContentLayout>
    );
  } catch (error) {
    console.error('Error in ODMPage:', error);
    return (
      <ContentLayout title="Erreur">
        <ErrorContent error={error as Error} />
      </ContentLayout>
    );
  }
}