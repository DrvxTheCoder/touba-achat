// app/api/bdc/[id]/generatePDF/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { BonDeCaissePDFTemplate } from '@/app/(utilisateur)/bdc/components/BonDeCaissePDFTemplate';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const id = parseInt(params.id);

    // Get the current user's details
    const currentUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    });

    const data = await prisma.bonDeCaisse.findUnique({
      where: { id },
      include: {
        department: true,
        creator: true,
        userCreator: true,
        approver: true,
        approverDAF: true,
        printedBy: true,
      }
    });

    if (!data) {
      return NextResponse.json({ error: 'BDC not found' }, { status: 404 });
    }

    // Check if current user is a CASHIER and BDC is in APPROVED_DAF status
    const isCashier = currentUser?.access?.includes('CASHIER');
    const isFirstPrint = data.status === 'APPROVED_DAF';

    const pdfData = {
      id: data.id,
      bdcId: data.bdcId,
      title: data.title,
      description: data.description as { item: string; amount: number }[],
      totalAmount: data.totalAmount,
      status: data.status,
      createdAt: data.createdAt.toISOString(),
      departmentId: data.departmentId,
      department: {
        id: data.department.id,
        name: data.department.name
      },
      creator: {
        name: data.creator.name,
        matriculation: data.creator.matriculation,
        jobTitle: data.creator.jobTitle || ''
      },
      approver: data.approver ? {
        name: data.approver.name
      } : null,
      approverDAF: data.approverDAF ? {
        name: data.approverDAF.name
      } : null,
      // Include current CASHIER's name if they're printing it for the first time
      printedBy: (isCashier && isFirstPrint) ? {
        name: currentUser?.name
      } : data.printedBy ? {
        name: data.printedBy.name
      } : null
    };

    // Generate PDF
    try {
      const pdfBuffer = await renderToBuffer(BonDeCaissePDFTemplate({ data: pdfData }));

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="BDC-${data.bdcId}.pdf"`
        }
      });
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return NextResponse.json(
        { error: 'Error generating PDF', details: pdfError instanceof Error ? pdfError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}