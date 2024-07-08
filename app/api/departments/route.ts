// File: app/api/departments/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departments = await prisma.department.findMany();
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid department name' }, { status: 400 });
    }

    const existingDepartment = await prisma.department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existingDepartment) {
      return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
    }

    const newDepartment = await prisma.department.create({
      data: { name },
    });

    return NextResponse.json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}