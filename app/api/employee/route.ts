// app/api/employee/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addEmployee } from './addEmployee';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await addEmployee(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/employee:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const search = searchParams.get('search') ?? '';
    const sortBy = (searchParams.get('sortBy') ?? 'name') as keyof Prisma.EmployeeOrderByWithRelationInput;
    const sortOrder = (searchParams.get('sortOrder') ?? 'asc') as 'asc' | 'desc';
    const departmentId = searchParams.get('departmentId');

    console.log('Received departmentId:', departmentId); // Log the received departmentId

    const skip = (page - 1) * limit;

    let where: Prisma.EmployeeWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { matriculation: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId && departmentId !== '-1') {
      where.departmentId = parseInt(departmentId);
    }

    console.log('Where clause:', where); // Log the where clause

    const orderBy: Prisma.EmployeeOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { department: true },
      }),
      prisma.employee.count({ where }),
    ]);

    console.log('Fetched employees:', employees.length); // Log the number of fetched employees

    return NextResponse.json({
      employees,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error in GET /api/employee:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}