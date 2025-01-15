// app/bdc/[id]/generatePDF/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { BonDeCaissePDF as BDCPdfComponent } from '@/app/(utilisateur)/bdc/components/BonDeCaissePDF';
import { prisma } from '@/lib/prisma';
import { ReactElement } from 'react';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const data = await prisma.bonDeCaisse.findUnique({
      where: { id },
      include: {
        department: true,
        creator: true,
        userCreator: true,
        approver: true,
        printedBy: true,
      }
    });

    if (!data) {
      return NextResponse.json(
        { error: 'BDC not found' },
        { status: 404 }
      );
    }

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
      printedBy: data.printedBy ? {
        name: data.printedBy.name
      } : null
    };

    // Create the PDF element
    const PdfElement: ReactElement = BDCPdfComponent({ data: pdfData });
    
    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(PdfElement);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="BDC-${data.bdcId}.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}