import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, AttachmentType } from '@prisma/client';
import { addAttachmentToEDB } from '../../utils/edbAuditLogUtil'; // Adjust the import path as needed
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"; // Adjust this import path as needed

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(session.user.id);

  const { id } = req.query;
  const { attachments } = req.body;

  if (!id || !attachments || !Array.isArray(attachments)) {
    return res.status(400).json({ message: 'Invalid request body' });
  }

  try {
    const edbId = parseInt(id as string, 10);

    // Check if the EDB exists
    const edb = await prisma.etatDeBesoin.findUnique({
      where: { id: edbId },
    });

    if (!edb) {
      return res.status(404).json({ message: 'EDB not found' });
    }

    // Save attachments and log events
    const savedAttachments = await Promise.all(
      attachments.map(async (attachment: any) => {
        const attachmentData = {
          filePath: attachment.url,
          fileName: attachment.file.name,
          supplierName: attachment.supplierName,
          totalAmount: attachment.totalAmount,
          type: AttachmentType.INITIAL, // Assuming INITIAL for new attachments
        };

        await addAttachmentToEDB(edbId, userId, attachmentData);

        return attachmentData;
      })
    );

    return res.status(200).json({ message: 'Attachments saved and events logged successfully', attachments: savedAttachments });
  } catch (error) {
    console.error('Error saving attachments:', error);
    return res.status(500).json({ message: 'Error saving attachments' });
  }
}