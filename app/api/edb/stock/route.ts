// app/api/stock-edb/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { convertToStandardEDB, createStockEDB, getStockEDBById, updateStockEDBStatus } from './utils/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { z } from 'zod';
import { getStockEDBs } from './utils/utils';
import { Role } from '@prisma/client';

const stockEdbSchema = z.object({
    description: z.object({
      items: z.array(z.object({
        name: z.string().min(1, "Le nom de l'article est requis"),
        quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
      })).min(1, "Ajoutez au moins un article"),
      comment: z.string().optional(),
    }),
    categoryId: z.number(),
    employeeType: z.enum(['registered', 'external']),
    employeeId: z.number().optional(),
    departmentId: z.number().optional(),
    externalEmployeeName: z.string().optional(),
  }).refine((data) => {
    if (data.employeeType === 'registered') {
      return data.employeeId !== undefined;
    }
    return data.departmentId !== undefined && data.externalEmployeeName !== undefined;
  }, {
    message: "Veuillez remplir les informations de l'employé correctement"
  });

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (!['MAGASINIER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = stockEdbSchema.parse(body);

    const newStockEDB = await createStockEDB(validatedData);

    return NextResponse.json(newStockEDB);
  } catch (error) {
    console.error('Error creating stock EDB:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'EDB de stock' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '5');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category');
    const department = searchParams.get('department') || null;
    const timeRange = searchParams.get('timeRange') || 'this-month';
    const status = searchParams.get('status') || undefined;

    const result = await getStockEDBs({
      page,
      pageSize,
      search,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      userRole: session.user.role as Role,
      userId: parseInt(session.user.id),
      timeRange,
      status,
      department: department ? parseInt(department) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stock EDbs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}



// For updating status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'MAGASINIER') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { stockEdbId, status } = body;

    if (!stockEdbId || !status) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const updatedEdb = await updateStockEDBStatus(
      parseInt(stockEdbId),
      status,
      parseInt(session.user.id)
    );

    return NextResponse.json(updatedEdb);
  } catch (error) {
    console.error('Error updating stock EDB:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// For converting to standard EDB
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'MAGASINIER') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const { stockEdbId } = await req.json();

    if (!stockEdbId) {
      return NextResponse.json(
        { error: 'ID de l\'EDB manquant' },
        { status: 400 }
      );
    }

    const convertedEdb = await convertToStandardEDB(
      parseInt(stockEdbId),
      parseInt(session.user.id)
    );

    return NextResponse.json(convertedEdb);
  } catch (error) {
    console.error('Error converting stock EDB:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la conversion' },
      { status: 500 }
    );
  }
}