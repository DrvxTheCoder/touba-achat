// app/api/edb/stock/[id]/convert/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { convertToStandardEDB } from '../../utils/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

export async function POST(
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

    if (!['MAGASINIER','ADMIN'].includes(session.user.role)) {
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

    const convertedEdb = await convertToStandardEDB(
      stockEdbId,
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