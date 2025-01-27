// app/api/edb/stock/[id]/deliver/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateStockEDBStatus } from '../../utils/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

export async function PATCH(
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

    if ((session.user.role !== 'MAGASINIER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const stockEdbId = parseInt(params.id);
    
    if (!stockEdbId) {
      return NextResponse.json(
        { error: 'ID de l\'EDB manquant' },
        { status: 400 }
      );
    }

    const updatedEdb = await updateStockEDBStatus(
      stockEdbId,
      'DELIVERED',
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