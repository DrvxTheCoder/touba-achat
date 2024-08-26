// app/dashboard/employes/page.tsx
"use client"
import { useState, useEffect } from "react";
import TeamSwitcher from "@/app/dashboard/components/team-switcher";
import { AddEmployeeForm } from "@/components/forms/add-user-form";
import { useAllowedRoles } from "@/app/hooks/use-allowed-roles";
import { SpinnerCircularFixed } from "spinners-react";
import { EmployeeDataTable } from "./components/employee-table";
import { getEmployees, EmployeeResponse } from "./components/data";

export default function Employes() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasReadAccess, hasWriteAccess } = useAllowedRoles()

  const handleDepartmentChange = (department: { id: number; name: string } | null) => {
    setSelectedDepartmentId(department?.id ?? null);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if(hasReadAccess || hasWriteAccess){
        setIsLoading(true);
        try {
          const data = await getEmployees(1, 10, '', 'name', 'asc', selectedDepartmentId);
          setEmployeeData(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching employee data:', err);
          setError('Une erreur s\'est produite lors de la récupération des données des employés');
          setEmployeeData(null);
        } finally {
          setIsLoading(false);
        }
      }
    };
  fetchInitialData();
  }, [selectedDepartmentId]);



  return(
    <>
      <title>Employés - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div>
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight">Employés</h2>
            <div className="flex items-center space-x-2">
              {hasWriteAccess && (<AddEmployeeForm />)}
              {hasWriteAccess && (<TeamSwitcher onDepartmentChange={handleDepartmentChange} />)}
            </div>
          </div>
        </div>
        {hasReadAccess ? (
          isLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed h- shadow-sm mb-2">
              <div className="flex flex-col items-center gap-1 text-center">
                <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                <small className="text-xs animated-dots mt-1">Chargement...</small>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">Erreur</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : (
            employeeData && (
              <EmployeeDataTable 
                key={selectedDepartmentId} 
                initialData={employeeData} 
                selectedDepartmentId={selectedDepartmentId}
              />
            )
          )
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
              <h3 className="text-2xl font-bold tracking-tight">Accès interdit</h3>
              <p className="text-sm text-muted-foreground">
                Vous n&apos;avez pas les permissions nécessaires pour accéder à ce contenu.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}