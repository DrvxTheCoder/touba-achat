import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { approveODMByFinance, rejectODMByFinance } from '../../utils/odm-util';


export async function POST(
    request: Request,
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
  
      const { approved, reason } = await request.json();
      const odmId = Number(params.id);
  
      if (approved) {
        const updatedOdm = await approveODMByFinance(odmId, parseInt(session.user.id));
        return NextResponse.json(updatedOdm);
      } else {
        const updatedOdm = await rejectODMByFinance(odmId, parseInt(session.user.id), reason);
        return NextResponse.json(updatedOdm);
      }
    } catch (error) {
      console.error('Error in finance approval:', error);
      return NextResponse.json(
        { error: 'Erreur interne du serveur' },
        { status: 500 }
      );
    }
  }