"use client"
import Link from "next/link"
import TeamSwitcher from "@/app/dashboard/components/team-switcher";
import { ShowToast } from "@/components/ShowToast";
import { AddEmployeeForm } from "@/components/forms/add-user-form";
import { useSession } from "next-auth/react";
import { allowedReadRoles, allowedWriteRoles } from "@/app/hooks/use-allowed-roles";
import { SpinnerCircularFixed } from "spinners-react";
import { DataTableDemo } from "./components/table-reference";

export default function Employes (){
  const { data: session } = useSession(); // Access session data

  // Check if the user's role is one of the allowed roles
  const hasReadAccess = session && allowedReadRoles.includes(session.user.role);
  const hasWriteAccess = session && allowedWriteRoles.includes(session.user.role);

    return(
      <>
      <title>Employés - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div>
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight">Employés</h2>
            <div className="flex items-center space-x-2">
              {hasWriteAccess && (<AddEmployeeForm />)}
              {hasReadAccess && (<TeamSwitcher />)}
            </div>
          </div>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
        >

          <div className="flex flex-col items-center gap-1 text-center">
          {hasReadAccess ? (
            <>
              {/* <h3 className="text-2xl font-bold tracking-tight">
                Aucune donnée disponible
              </h3>
              <p className="text-sm text-muted-foreground">
                Les données s&apos;afficheront ici une fois alimenté.
              </p>
              <AddEmployeeForm /> */}
              {/* <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
              <small className="text-xs animated-dots mt-1">Chargement...</small> */}
              <DataTableDemo />
            </>            
          ):(
            <>
            <h3 className="text-2xl font-bold tracking-tight">Accès interdit</h3>
            <p className="text-sm text-muted-foreground">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à ce contenu.
            </p>
            </>

          )}

          </div>
        </div>
      </main>
      </>
    );
}