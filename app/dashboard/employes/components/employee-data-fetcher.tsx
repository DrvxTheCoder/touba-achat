import { DataTableDemo } from "./table-reference";

async function getEmployees() {
  // Replace with your actual API endpoint
  const res = await fetch(`/api/employee`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }
  return res.json();
}

export default async function EmployeeDataFetcher() {
  const data = await getEmployees();
  return <DataTableDemo initialData={data} />;
}