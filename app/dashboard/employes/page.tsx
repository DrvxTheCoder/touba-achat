import Link from "next/link"
import TeamSwitcher from "@/app/dashboard/components/team-switcher";
import { ShowToast } from "@/components/ShowToast";
import AddUserDialog from "@/components/forms/add-user-dialog";

export default function Employes (){
    return(
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div>
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight">Employés</h2>
            <div className="flex items-center space-x-2">
            <TeamSwitcher />
            </div>
          </div>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm"
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Aucune donnée disponible
            </h3>
            <p className="text-sm text-muted-foreground">
              Les données s&apos;afficheront ici une fois alimenté.
            </p>
            {/* <ShowToast /> */}
            <AddUserDialog/>
          </div>
        </div>
      </main>
    );
}