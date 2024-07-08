// app/dashboard/employes/components/employee-data-fetcher.tsx
"use client"
import { useEffect, useState } from 'react';
import { EmployeeDataTable } from "./employee-table";
import { SpinnerCircularFixed } from 'spinners-react';

interface EmployeeDataFetcherProps {
  departmentId: number | null;
}

async function getEmployees(departmentId: number | null) {
  const url = new URL('/api/employee', window.location.origin);
  if (departmentId !== null) {
    url.searchParams.append('departmentId', departmentId.toString());
  }
  const res = await fetch(url, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }
  return res.json();
}

export default function EmployeeDataFetcher({ departmentId }: EmployeeDataFetcherProps) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    getEmployees(departmentId)
      .then((fetchedData) => {
        setData(fetchedData);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [departmentId]);

  if (isLoading) return (

  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
    <div className="flex flex-col items-center gap-1 text-center">
      <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
      <small className="text-xs animated-dots mt-1">Chargement...</small>
    </div>
  </div>
  );
  if (error) return (

    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
    <div className="flex flex-col items-center gap-1 text-center">
      <h3 className="text-2xl font-bold tracking-tight">Erreur Interne du Serveur</h3>
      <p className="text-sm text-muted-foreground">
        Une erreur inattendu s&apos;est produite lors du chargement des données. Ressayez plus tard.
      </p>
    </div>
  </div>
    );
  if (!data) return null;

  return <EmployeeDataTable initialData={data} />;
}