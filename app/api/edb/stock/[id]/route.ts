import { NextRequest, NextResponse } from 'next/server';
import { getStockEDBById, updateStockEDBStatus } from '../utils/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { Role } from '@prisma/client';

// For getting a single stock EDB
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 401 }
        );
      }
  
      const stockEdb = await getStockEDBById(
        parseInt(params.id),
        session.user.role as Role,
        parseInt(session.user.id)
      );
  
      return NextResponse.json(stockEdb);
    } catch (error) {
      console.error('Error fetching stock EDb:', error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Erreur lors de la récupération des données'
        },
        { status: 500 }
      );
    }
  }

