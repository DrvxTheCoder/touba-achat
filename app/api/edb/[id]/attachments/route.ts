// api/edb/[id]/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AttachmentType } from '@prisma/client';
import { addAttachmentToEDB } from '@/app/api/edb/utils/edbAuditLogUtil';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

function extractFileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const edbId = parseInt(params.id, 10);

    if (isNaN(edbId)) {
      return NextResponse.json({ message: 'Invalid EDB ID' }, { status: 400 });
    }

    const body = await request.json();
    const { attachments } = body;

    if (!attachments || !Array.isArray(attachments)) {
      return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
    }

    const savedAttachments = await Promise.all(
      attachments.map(async (attachment: any) => {

        const fileName = attachment.invoiceName || attachment.file?.name || extractFileNameFromUrl(attachment.url);

        const attachmentData = {
          filePath: attachment.url,
          fileName: fileName,
          supplierName: attachment.supplierName,
          totalAmount: parseFloat(attachment.totalAmount),
          type: AttachmentType.MAGASINIER,
        };

        const updatedEDB = await addAttachmentToEDB(edbId, userId, attachmentData);

        return {
          ...attachmentData,
          edbStatus: updatedEDB.status
        };
      })
    );

    return NextResponse.json({ 
      message: 'Attachments saved and events logged successfully', 
      attachments: savedAttachments,
      updatedEDBStatus: savedAttachments[savedAttachments.length - 1].edbStatus
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving attachments:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Error saving attachments', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  }
}