import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EtatsSingle } from '../components/EtatsSingle';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

async function getEDB(edbId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new Error('Unauthorized');
    }

    const edb = await prisma.etatDeBesoin.findUnique({
      where: { edbId: edbId },
      include: {
        creator: {
          include: {
            user: true,
            currentDepartment: true
          }
        },
        userCreator: true,
        department: true,
        category: true,
        attachments: {
          orderBy: {
            uploadedAt: 'desc'
          }
        },
        finalSupplier: {
          include: {
            chooser: true
          }
        },
        approver: true,
        itApprover: true,
        finalApprover: true,
        auditLogs: {
          include: {
            user: true
          },
          orderBy: {
            eventAt: 'desc'
          }
        },
        orders: true
      }
    });

    if (!edb) {
      notFound();
    }

    return edb;
  } catch (error) {
    console.error('Error in getEDB:', error);
    throw error;
  }
}

export default async function EDBPage({ params }: { params: { id: string } }) {
  try {
    const edb = await getEDB(params.id);
    return <EtatsSingle edb={edb} />;
  } catch (error) {
    console.error('Error in EDBPage:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return <div>Unauthorized: Please log in to view this EDB.</div>;
    }
    return <div>Error loading EDB: {(error as Error).message}</div>;
  }
}