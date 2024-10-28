// app/api/stock-edb/utils.ts

import { prisma } from '@/lib/prisma';
import generateEDBId from '../../utils/edb-id-generator';
import { Prisma } from '@prisma/client';

export async function createStockEDB(
    data: {
      description: {
        items: Array<{ name: string; quantity: number }>;
        comment?: string;
      };
      categoryId: number;
      employeeType: 'registered' | 'external';
      employeeId?: number;
      departmentId?: number;  // Optional since we'll get it from employee for registered users
      externalEmployeeName?: string;
    }
  ) {
    // For registered employees, get their department
    if (data.employeeType === 'registered' && data.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        include: { currentDepartment: true }
      });
  
      if (!employee) {
        throw new Error('Employé introuvable');
      }
  
      return await prisma.stockEtatDeBesoin.create({
        data: {
          edbId: generateEDBId(),
          description: data.description as Prisma.JsonObject,
          employee: { connect: { id: data.employeeId } },
          department: { connect: { id: employee.currentDepartmentId } },
          category: { connect: { id: data.categoryId } },
        },
        include: {
          department: true,
          category: true,
          employee: true
        }
      });
    } 
    // For external employees
    else {
      if (!data.departmentId) {
        throw new Error('Département requis pour les employés externes');
      }
  
      return await prisma.stockEtatDeBesoin.create({
        data: {
          edbId: generateEDBId(),
          description: data.description as Prisma.JsonObject,
          externalEmployeeName: data.externalEmployeeName,
          department: { connect: { id: data.departmentId } },
          category: { connect: { id: data.categoryId } },
        },
        include: {
          department: true,
          category: true,
          employee: true
        }
      });
    }
  }

  export async function getStockEDBs(params?: {
    departmentId?: number;
    employeeId?: number;
    categoryId?: number;
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const skip = params?.page && params?.pageSize ? (params.page - 1) * params.pageSize : undefined;
    const take = params?.pageSize;
  
    // Build the where condition
    const where: Prisma.StockEtatDeBesoinWhereInput = {
      // Base filters
      ...(params?.departmentId && { departmentId: params.departmentId }),
      ...(params?.employeeId && { employeeId: params.employeeId }),
      ...(params?.categoryId && { categoryId: params.categoryId }),
  
      // Search conditions
      ...(params?.search ? {
        OR: [
          { 
            edbId: { 
              contains: params.search,
              mode: 'insensitive' as Prisma.QueryMode
            } 
          },
          { 
            employee: { 
              name: { 
                contains: params.search,
                mode: 'insensitive' as Prisma.QueryMode
              } 
            } 
          },
          { 
            externalEmployeeName: { 
              contains: params.search,
              mode: 'insensitive' as Prisma.QueryMode
            } 
          },
          {
            description: {
              path: ['items'],
              array_contains: [{
                name: { contains: params.search }
              }]
            } as Prisma.JsonFilter
          }
        ]
      } : {})
    };
  
    // Get total count for pagination
    const total = await prisma.stockEtatDeBesoin.count({ where });
  
    // Get filtered and paginated data
    const data = await prisma.stockEtatDeBesoin.findMany({
      where,
      include: {
        department: true,
        category: true,
        employee: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  
    return {
      data,
      total,
      page: params?.page || 1,
      pageSize: params?.pageSize || 10
    };
  }

export async function getStockEDBById(id: number) {
  return await prisma.stockEtatDeBesoin.findUnique({
    where: { id },
    include: {
      department: true,
      category: true,
      employee: true
    }
  });
}