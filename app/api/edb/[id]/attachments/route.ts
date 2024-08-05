import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AttachmentType, EDBStatus } from '@prisma/client';
import { addAttachmentToEDB, updateEDBStatus } from '../../utils/edbAuditLogUtil';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

const prisma = new PrismaClient();

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

    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: edbId },
    });

    if (!edb) {
      return NextResponse.json({ message: 'EDB not found' }, { status: 404 });
    }

    const savedAttachments = await Promise.all(
      attachments.map(async (attachment: any) => {
        console.log('Received attachment:', attachment);

        const fileName = attachment.invoiceName || attachment.file?.name || extractFileNameFromUrl(attachment.url);

        const attachmentData = {
          filePath: attachment.url,
          fileName: fileName,
          supplierName: attachment.supplierName,
          totalAmount: parseFloat(attachment.totalAmount),
          type: AttachmentType.MAGASINIER,
        };

        console.log('Processed attachment data:', attachmentData);

        await addAttachmentToEDB(edbId, userId, attachmentData);

        return attachmentData;
      })
    );

    return NextResponse.json({ message: 'Attachments saved and events logged successfully', attachments: savedAttachments }, { status: 200 });
  } catch (error) {
    console.error('Error saving attachments:', error);
    return NextResponse.json({ message: 'Error saving attachments', error: (error as Error).message }, { status: 500 });
  }
}