import { Button } from "@/components/ui/button";
export default function Etats(){
    return(
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">États de besoins</h1>
        </div>
        <div
          className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm" x-chunk="dashboard-02-chunk-1"
        >
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Aucun état de besoin
            </h3>
            <p className="text-sm text-muted-foreground">
              Votre état de besoin s'affichera ici une fois ajouté.
            </p>
            <Button className="mt-4">Créer</Button>
          </div>
        </div>
      </main>
    );
}