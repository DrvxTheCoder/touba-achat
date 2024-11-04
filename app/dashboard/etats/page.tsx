"use client";

import { useAllowedRoles } from "@/app/hooks/use-allowed-roles";
import Etats from "./components/Etats";
import { useSession } from "next-auth/react";
import { ContentLayout } from "@/components/user-panel/content-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import DynamicBreadcrumbs from "@/components/DynamicBreadcrumbs";

const UnauthorizedContent = ({ message }: { message: string }) => (
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
          {message}
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/acceuil">Retourner à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  </main>
);

const LoadingContent = () => (
  <ContentLayout title="Chargement...">
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  </ContentLayout>
);

const EtatsPage = () => {
  const { data: session, status } = useSession();
  const { hasReadAccess } = useAllowedRoles();

  if (status === "loading") {
    return <LoadingContent />;
  }

  if (!session) {
    return (
      <ContentLayout title="Non-autorisé">
        <UnauthorizedContent message="Veuillez vous connecter pour accéder à cette page." />
      </ContentLayout>
    );
  }

  if (!hasReadAccess) {
    return (
      <ContentLayout title="Non-autorisé">
        <UnauthorizedContent message="Vous n'avez pas les permissions nécessaires pour accéder à ce contenu." />
      </ContentLayout>
    );
  }

  return (
    <ContentLayout title="États de Besoins">
      <DynamicBreadcrumbs />
      <Etats />
    </ContentLayout>
  );
};

export default EtatsPage;