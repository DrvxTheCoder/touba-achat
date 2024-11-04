// app/dashboard/etats/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EtatsSingle } from '../components/EtatsSingle';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { ContentLayout } from "@/components/user-panel/content-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DynamicBreadcrumbs from '@/components/DynamicBreadcrumbs';
import { AlertTriangle } from 'lucide-react';


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

async function checkRole(session: any) {
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
async function checkAccess(session: any) {
  const allowedReadAccess = [
    "APPROVE_EDB",
    "ATTACH_DOCUMENTS",
    "CHOOSE_SUPPLIER",
    "FINAL_APPROVAL",
    "IT_APPROVAL",
  ] as const;

  // If user has no access array, return false
  if (!session?.user?.access) return false;

  // Check if any of the user's access rights match the allowed ones
  return session.user.access.some((access: any) => allowedReadAccess.includes(access));
}

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
          <Link href="/dashboard/etats">Retour aux états de besoins</Link>
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
      <Button variant={null} className="bg-none hover:bg-none cursor-default"><AlertTriangle /></Button>
        <h3 className="text-2xl font-bold tracking-tight">
          Une erreur est survenue
        </h3>
        <p className="text-sm text-muted-foreground">
          Erreur lors du chargement de l&apos;EDB : EDB introuvable
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/dashboard/etats">Retour aux états de besoins</Link>
        </Button>
      </div>
    </div>
  </main>
);

export default async function EDBPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }

  const hasRole = await checkRole(session);
  const hasAccess = await checkAccess(session);
  
  if (!hasRole && !hasAccess) {
    return (
      <ContentLayout title="Non-autorisé">
        <UnauthorizedContent />
      </ContentLayout>
    );
  }

  try {
    const edb = await getEDB(params.id);
    return (
      <ContentLayout title={`État de Besoin - ${edb.edbId}`}>
        <DynamicBreadcrumbs />
        <EtatsSingle edb={edb} />
      </ContentLayout>
    );
  } catch (error) {
    console.error('Error in EDBPage:', error);
    return (
      <ContentLayout title="Erreur">
        <ErrorContent error={error as Error} />
      </ContentLayout>
    );
  }
}