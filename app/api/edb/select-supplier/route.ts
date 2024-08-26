// app/api/edb/select-supplier/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { chooseFinalSupplier } from '../utils/edbAuditLogUtil';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
  
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  
    const { edbId, attachmentId } = await req.json();
  
    try {
      const edb = await prisma.etatDeBesoin.findUnique({
        where: { id: edbId },
        include: { category: true },
      });
  
      if (!edb) {
        return NextResponse.json({ error: 'EDB non trouvé' }, { status: 404 });
      }
  
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });
  
      if (!attachment) {
        return NextResponse.json({ error: 'Pièce jointe non trouvée' }, { status: 404 });
      }
  
      const isITCategory = ['Matériel informatique', 'Logiciels et licences'].includes(edb.category.name);
      if (isITCategory && session.user.role !== Role.IT_ADMIN) {
        return NextResponse.json({ error: 'Ce choix est reservé au Service Informatique' }, { status: 403 });
      }
  
      const updatedEDB = await chooseFinalSupplier(
        edb.id,
        parseInt(session.user.id),
        {
          filePath: attachment.filePath,
          supplierName: attachment.supplierName,
          amount: attachment.totalAmount,
        }
      );
  
      return NextResponse.json({ message: 'Fournisseur sélectionné avec succès', edb: updatedEDB });
    } catch (error) {
      console.error('Erreur lors de la sélection du fournisseur:', error);
      return NextResponse.json({ error: 'Erreur serveur lors de la sélection du fournisseur' }, { status: 500 });
    }
  }