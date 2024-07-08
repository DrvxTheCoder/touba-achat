// app/dashboard/employes/page.tsx
"use client"
import { useState, useEffect, useCallback } from "react";
import TeamSwitcher from "@/app/dashboard/components/team-switcher";
import { AddEmployeeForm } from "@/components/forms/add-user-form";
import { useSession } from "next-auth/react";
import { allowedReadRoles, allowedWriteRoles } from "@/app/hooks/use-allowed-roles";
import { SpinnerCircularFixed } from "spinners-react";
import { EmployeeDataTable } from "./components/employee-table";

async function getEmployees(departmentId: number | null) {
  const url = new URL('/api/employee', window.location.origin);
  if (departmentId !== null && departmentId !== -1) {
    url.searchParams.append('departmentId', departmentId.toString());
  }
  console.log('Fetching from URL:', url.toString()); // Log the URL being fetched
  const res = await fetch(url, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }
  const data = await res.json();
  console.log('Fetched data:', data); // Log the fetched data
  return data;
}

export default function Employes() {
  const { data: session } = useSession();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasReadAccess = session && allowedReadRoles.includes(session.user.role);
  const hasWriteAccess = session && allowedWriteRoles.includes(session.user.role);

  const handleDepartmentChange = useCallback((department: { id: number; name: string } | null) => {
    console.log('Department changed:', department); // Log the selected department
    setSelectedDepartmentId(department?.id ?? null);
  }, []);

  useEffect(() => {
    console.log('Effect triggered. Selected Department ID:', selectedDepartmentId); // Log when effect is triggered
    setIsLoading(true);
    getEmployees(selectedDepartmentId)
      .then((fetchedData) => {
        console.log('Data fetched successfully:', fetchedData); // Log the fetched data
        setEmployeeData(fetchedData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err); // Log any errors
        setError(err.message);
        setIsLoading(false);
      });
  }, [selectedDepartmentId]);

  return(
    <>
      <title>Employés - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-2 md:p-8">
        <div>
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-lg md:text-3xl font-bold tracking-tight">Employés</h2>
            <div className="flex items-center space-x-2">
              {hasWriteAccess && (<AddEmployeeForm />)}
              {hasReadAccess && (<TeamSwitcher onDepartmentChange={handleDepartmentChange} />)}
            </div>
          </div>
        </div>
        {hasReadAccess ? (
          isLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-1 text-center">
                <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
                <small className="text-xs animated-dots mt-1">Chargement...</small>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">Erreur Interne du Serveur</h3>
                <p className="text-sm text-muted-foreground">
                  Une erreur inattendue s&apos;est produite lors du chargement des données. Réessayez plus tard.
                </p>
              </div>
            </div>
          ) : (
            employeeData && <EmployeeDataTable key={selectedDepartmentId} initialData={employeeData} />
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