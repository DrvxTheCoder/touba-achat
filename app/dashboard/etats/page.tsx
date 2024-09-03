// app/dashboard/etats/page.tsx
"use client";

import { useAllowedRoles } from "@/app/hooks/use-allowed-roles";
import Etats from "./components/Etats";
import { useSession } from "next-auth/react";

const EtatsPage = () => {
  const { data: session, status } = useSession();
  const { hasReadAccess } = useAllowedRoles();

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">Accès non autorisé</h3>
            <p className="text-sm text-muted-foreground">
              Veuillez vous connecter pour accéder à cette page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <title>États de Besoins - Touba App™</title>
      {hasReadAccess ? (
        <Etats />
      ) : (
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
      )}
    </>
  );
};

export default EtatsPage;