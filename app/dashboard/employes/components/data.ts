export type Employee = {
    id: number;
    name: string;
    email: string;
    matriculation: string;
    phoneNumber: string | null;
    department: {
      name: string;
    };
  };
  
  export type EmployeeResponse = {
    employees: Employee[];
    totalPages: number;
    currentPage: number;
    totalCount: number;  // Add this line
  };
  
  export async function getEmployees(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<EmployeeResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sortBy,
      sortOrder,
    });
  
    const response = await fetch(`/api/employee?${params}`);
    if (!response.ok) {
      throw new Error('Échec de la récupération des employés');
    }
  
    return response.json();
  }