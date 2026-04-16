import { NextRequest, NextResponse } from 'next/server';
import { updateStockEDBStatus } from '../../utils/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autoris\u00e9' }, { status: 401 });
    }

    if (session.user.role !== 'MAGASINIER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autoris\u00e9' }, { status: 403 });
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Liste d\'IDs requise' },
        { status: 400 }
      );
    }

    const results: { id: number; success: boolean; error?: string }[] = [];

    for (const id of ids) {
      try {
        await updateStockEDBStatus(id, 'DELIVERED', parseInt(session.user.id));
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({ results, successCount, failureCount });
  } catch (error) {
    console.error('Error in bulk deliver:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la mise \u00e0 jour' },
      { status: 500 }
    );
  }
}
