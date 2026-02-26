import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import {
  approveODMByDirector,
  approveDRHForProcessing,
  validateByDRH,
  approveByDOG,
  restartODMToProcessing,
  restartODMToDOGApproval
} from '@/app/api/odm/utils/odm-util';

/**
 * ODM Approval Endpoint
 * Handles all approval actions in the new workflow:
 *
 * action: 'director_approve' - Director approves (SUBMITTED -> AWAITING_DRH_APPROVAL)
 * action: 'drh_approve' - DRH marks for processing (AWAITING_DRH_APPROVAL -> RH_PROCESSING)
 * action: 'drh_validate' - DRH validates RH work (AWAITING_DRH_VALIDATION -> AWAITING_DOG_APPROVAL)
 * action: 'dog_approve' - DOG final approval (AWAITING_DOG_APPROVAL -> READY_FOR_PRINT)
 * action: 'restart_to_processing' - DRH restarts rejected ODM to RH_PROCESSING
 * action: 'restart_to_dog' - DRH restarts rejected ODM to AWAITING_DOG_APPROVAL
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: userId } = session.user;
    const odmId = parseInt(params.id);

    if (isNaN(odmId)) {
      return NextResponse.json({ error: 'ID ODM invalide' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { action } = body || {};

    let updatedODM;

    switch (action) {
      case 'director_approve':
        // Director approves ODM (SUBMITTED -> AWAITING_DRH_APPROVAL)
        updatedODM = await approveODMByDirector(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM approuvé par le directeur',
          odm: updatedODM
        });

      case 'drh_approve':
        // DRH marks for RH processing (AWAITING_DRH_APPROVAL -> RH_PROCESSING)
        updatedODM = await approveDRHForProcessing(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM envoyé pour traitement RH',
          odm: updatedODM
        });

      case 'drh_validate':
        // DRH validates RH work (AWAITING_DRH_VALIDATION -> AWAITING_DOG_APPROVAL)
        updatedODM = await validateByDRH(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM validé par DRH, envoyé pour approbation DOG',
          odm: updatedODM
        });

      case 'dog_approve':
        // DOG final approval (AWAITING_DOG_APPROVAL -> READY_FOR_PRINT)
        updatedODM = await approveByDOG(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM approuvé par DOG, prêt pour impression',
          odm: updatedODM
        });

      case 'restart_to_processing':
        // DRH restarts rejected ODM to RH_PROCESSING
        updatedODM = await restartODMToProcessing(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM redémarré vers traitement RH',
          odm: updatedODM
        });

      case 'restart_to_dog':
        // DRH restarts rejected ODM to AWAITING_DOG_APPROVAL
        updatedODM = await restartODMToDOGApproval(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM redémarré vers approbation DOG',
          odm: updatedODM
        });

      // Legacy action support
      case 'approveRHDirector':
        updatedODM = await approveDRHForProcessing(odmId, parseInt(userId));
        return NextResponse.json(updatedODM);

      default:
        // Legacy flow - treat as director approval
        updatedODM = await approveODMByDirector(odmId, parseInt(userId));
        return NextResponse.json({
          message: 'ODM approuvé avec succès',
          odm: updatedODM
        });
    }
  } catch (error) {
    console.error('Erreur lors de l\'approbation de l\'ODM:', error);
    return NextResponse.json({
      error: (error as Error).message || 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
