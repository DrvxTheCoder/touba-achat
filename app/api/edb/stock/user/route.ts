// app/api/edb/stock/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createUserStockEDB, getStockEDBs } from '../utils/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { z } from 'zod';
import { Role } from '@prisma/client';

const userStockEdbSchema = z.object({
  description: z.object({
    items: z.array(z.object({
      name: z.string().min(1, "Le nom de l'article est requis"),
      quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
    })).min(1, "Ajoutez au moins un article"),
    comment: z.string().optional(),
  }),
  categoryId: z.number()
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


    const body = await req.json();
    const validatedData = userStockEdbSchema.parse(body);

    const newStockEDB = await createUserStockEDB(
      parseInt(session.user.id), 
      validatedData
    );

    return NextResponse.json(newStockEDB);
  } catch (error) {
    console.error('Error creating user stock EDB:', error);
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

    const result = await getStockEDBs({
      page,
      pageSize,
      search,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      userRole: session.user.role as Role,
      userId: parseInt(session.user.id)
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user stock EDbs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}