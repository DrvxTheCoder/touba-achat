import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const edbId = params.id;

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
      return NextResponse.json({ error: 'EDB not found' }, { status: 404 });
    }

    const formattedEDB = {
      id: edb.id,
      edbId: edb.edbId,
      title: edb.title,
      description: edb.description,
      status: edb.status,
      createdAt: edb.createdAt.toISOString(),
      updatedAt: edb.updatedAt.toISOString(),
      isEscalated: edb.isEscalated,
      references: edb.references,
      category: {
        id: edb.category.id,
        name: edb.category.name
      },
      department: {
        id: edb.department.id,
        name: edb.department.name
      },
      creator: {
        id: edb.creator.id,
        name: edb.creator.user.name,
        email: edb.creator.user.email,
        department: edb.creator.currentDepartment.name
      },
      userCreator: {
        id: edb.userCreator.id,
        name: edb.userCreator.name,
        email: edb.userCreator.email
      },
      approver: edb.approver ? {
        id: edb.approver.id,
        name: edb.approver.name,
        email: edb.approver.email
      } : null,
      itApprover: edb.itApprover ? {
        id: edb.itApprover.id,
        name: edb.itApprover.name,
        email: edb.itApprover.email
      } : null,
      finalApprover: edb.finalApprover ? {
        id: edb.finalApprover.id,
        name: edb.finalApprover.name,
        email: edb.finalApprover.email
      } : null,
      attachments: edb.attachments.map(attachment => ({
        id: attachment.id,
        fileName: attachment.fileName,
        filePath: attachment.filePath,
        supplierName: attachment.supplierName,
        totalAmount: attachment.totalAmount,
        uploadedAt: attachment.uploadedAt.toISOString(),
        uploadedBy: attachment.uploadedBy,
        type: attachment.type
      })),
      finalSupplier: edb.finalSupplier ? {
        id: edb.finalSupplier.id,
        filePath: edb.finalSupplier.filePath,
        supplierName: edb.finalSupplier.supplierName,
        amount: edb.finalSupplier.amount,
        chosenAt: edb.finalSupplier.chosenAt.toISOString(),
        chosenBy: {
          id: edb.finalSupplier.chooser.id,
          name: edb.finalSupplier.chooser.name,
          email: edb.finalSupplier.chooser.email
        }
      } : null,
      auditLogs: edb.auditLogs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        eventAt: log.eventAt.toISOString(),
        user: {
          id: log.user.id,
          name: log.user.name,
          email: log.user.email
        },
        details: log.details
      })),
      orders: edb.orders.map(order => ({
        id: order.id,
        amount: order.amount,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      })),
      totalAmount: edb.orders.reduce((sum, order) => sum + order.amount, 0),
      items: (edb.description as any).items.map((item: { designation: string, quantity: number }) => ({
        designation: item.designation,
        quantity: item.quantity
      })),
      rejectionReason: edb.rejectionReason,
      magasinierAttachedAt: edb.magasinierAttachedAt?.toISOString(),
      itApprovalRequired: edb.itApprovalRequired,
      itApprovedAt: edb.itApprovedAt?.toISOString(),
      finalApprovedAt: edb.finalApprovedAt?.toISOString()
    };

    return NextResponse.json(formattedEDB);
  } catch (error) {
    console.error('Error fetching EDB:', error);
    return NextResponse.json({ error: 'Error fetching EDB' }, { status: 500 });
  }
}