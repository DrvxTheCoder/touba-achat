import { Access } from "@prisma/client";

export type Employee = {
  id: number;
  name: string;
  email: string;
  matriculation: string;
  phoneNumber: string;
  userId: number;
  jobTitle: string,
  currentDepartmentId: number;
  status: string;
  access: Access[];
  currentDepartment: {
    id: number;
    name: string;
  };
};

export type EmployeeResponse = {
  employees: Employee[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
};

export async function getEmployees(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  currentdepartmentId: number | null = null
): Promise<EmployeeResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    sortBy,
    sortOrder,
  });

  if (currentdepartmentId !== null) {
    params.append('departmentId', currentdepartmentId.toString());
  }

  console.log(`Fetching employees with params: ${params.toString()}`);

  const response = await fetch(`/api/employee?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Échec de la récupération des employés');
  }

  const data = await response.json();
  console.log('Received employee data:', data);

  return data;
}