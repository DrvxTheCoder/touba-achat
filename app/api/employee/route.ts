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
      where.currentDepartmentId = parseInt(departmentId);
    }
    // where.status = 'ACTIVE'; // Only fetch active employees

    console.log('Where clause:', where); // Log the where clause

    const orderBy: Prisma.EmployeeOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { currentDepartment: true },
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

// export async function PUT(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { id, ...updateData } = body;

//     if (!id) {
//       return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
//     }

//     const updatedEmployee = await prisma.employee.update({
//       where: { id: Number(id) },
//       data: {
//         name: updateData.name,
//         email: updateData.email,
//         matriculation: updateData.matriculation,
//         phoneNumber: updateData.phoneNumber,
//         departmentId: updateData.department, // Assuming department is the department ID
//         // Add any other fields that can be updated
//       },
//       include: {
//         department: true,
//       },
//     });

//     return NextResponse.json(updatedEmployee);
//   } catch (error) {
//     console.error('Error in PUT /api/employee:', error);
//     return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
//   }
// }

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Check if the email or matriculation is already taken by another user
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email: updateData.email },
          { matriculation: updateData.matriculation },
        ],
        NOT: { id: Number(id) }, // Exclude the current employee being updated
      },
    });

    if (existingEmployee) {
      return NextResponse.json({ error: 'L\'email ou le matricule existe déja' }, { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        name: updateData.name,
        email: updateData.email,
        matriculation: updateData.matriculation,
        phoneNumber: updateData.phoneNumber,
        currentDepartmentId: updateData.department, // Assuming department is the department ID
        status: updateData.status, // Update the status if needed
        // Add any other fields that can be updated
      },
      include: {
        currentDepartment: true,
      },
    });
    const updatedUser = await prisma.user.update({
      where: { id: Number(updateData.userId) },
      data: {
        name: updateData.name,
        email: updateData.email,
        status: updateData.status, // Update the status if needed
        // Add any other fields that can be updated
      }
    });



    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Error in PUT /api/employee:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('DELETE request received for employee ID:', params.id);

  try {
    const id = parseInt(params.id);

    console.log('Attempting to delete employee with ID:', id);

    // Delete the employee without checking if it exists first
    const deletedEmployee = await prisma.employee.delete({
      where: { id },
    });

    console.log('Employee deleted:', deletedEmployee);

    return NextResponse.json({ message: 'Employee deleted successfully', employee: deletedEmployee }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/employee/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete employee', details: error }, { status: 500 });
  }
}