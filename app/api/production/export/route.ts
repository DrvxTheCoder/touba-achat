// app/api/production/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { renderToBuffer } from '@react-pdf/renderer';
import MonthlyProductionPDF from '@/lib/pdf/MonthlyProductionPDF';
import DynamicMonthlyProductionPDF from '@/lib/pdf/DynamicMonthlyProductionPDF';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!session.user.access?.includes('EXPORT_PRODUCTION_REPORTS')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const body = await req.json();
    let { format, startDate, endDate, productionCenterId, capaciteTotale } = body;

    // Center-based access control for non-privileged users
    const PRIVILEGED_ROLES = ['ADMIN', 'DIRECTEUR_GENERAL', 'DOG', 'DIRECTEUR'];
    if (!PRIVILEGED_ROLES.includes(session.user.role)) {
      const userCenter = await prisma.productionCenter.findFirst({
        where: { chefProductionId: parseInt(session.user.id) },
        select: { id: true }
      });
      if (userCenter) {
        productionCenterId = userCenter.id;
      } else {
        return NextResponse.json({ error: 'Aucun centre assigné' }, { status: 403 });
      }
    }

    // Validation
    if (!format || !['excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Get production center with full configuration if specified
    const productionCenter = productionCenterId
      ? await prisma.productionCenter.findUnique({
          where: { id: parseInt(productionCenterId) },
          include: {
            approFieldConfigs: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              select: { id: true, name: true, label: true, order: true }
            },
            sortieFieldConfigs: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
              select: { id: true, name: true, label: true, order: true }
            },
            reservoirs: {
              orderBy: { name: 'asc' },
              select: { id: true, name: true, type: true, capacity: true, capacityTonnes: true }
            }
          }
        })
      : null;

    // Récupérer les données
    const inventories = await prisma.productionInventory.findMany({
      where: {
        date: { gte: start, lte: end },
        status: 'TERMINE',
        ...(productionCenterId && { productionCenterId: parseInt(productionCenterId) })
      },
      orderBy: { date: 'asc' },
      include: {
        bottles: true,
        reservoirs: {
          include: {
            reservoirConfig: {
              select: { name: true, type: true, capacity: true }
            }
          }
        },
        arrets: {
          include: {
            createdBy: { select: { id: true, name: true } }
          }
        },
        approValues: {
          include: {
            fieldConfig: true
          }
        },
        sortieValues: {
          include: {
            fieldConfig: true
          }
        },
        startedBy: { select: { name: true } },
        completedBy: { select: { name: true } }
      }
    });

    // Debug logging for dynamic field values
    console.log('=== EXPORT DEBUG ===');
    console.log('Inventories count:', inventories.length);
    if (inventories.length > 0) {
      console.log('First inventory approValues:', JSON.stringify(inventories[0].approValues, null, 2));
      console.log('First inventory sortieValues:', JSON.stringify(inventories[0].sortieValues, null, 2));
    }
    console.log('====================');

    if (format === 'excel') {
      // Créer un workbook Excel
      const workbook = XLSX.utils.book_new();

      // Feuille 1: Résumé
      const summaryData = inventories.map((inv) => ({
        Date: new Date(inv.date).toLocaleDateString('fr-FR'),
        'Stock Initial (T)': inv.stockInitialPhysique,
        'Butanier (T)': inv.butanier || 0,
        'Cumul Sortie (T)': inv.cumulSortie,
        'Stock Final Physique (T)': inv.stockFinalPhysique || 0,
        'Stock Final Théorique (T)': inv.stockFinalTheorique || 0,
        'Écart (T)': inv.ecart || 0,
        'Écart (%)': inv.ecartPourcentage ? inv.ecartPourcentage.toFixed(2) + '%' : '0%',
        'Rendement (%)': inv.rendement ? inv.rendement.toFixed(2) + '%' : '0%',
        'Bouteilles': inv.totalBottlesProduced,
        'Arrêts': inv.arrets?.length || 0
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

      // Feuille 2: Détails production
      const productionData: any[] = [];
      inventories.forEach((inv) => {
        inv.bottles?.forEach((bottle) => {
          productionData.push({
            Date: new Date(inv.date).toLocaleDateString('fr-FR'),
            Type: bottle.type,
            Quantité: bottle.quantity,
            'Tonnage (T)': bottle.tonnage
          });
        });
      });

      if (productionData.length > 0) {
        const productionSheet = XLSX.utils.json_to_sheet(productionData);
        XLSX.utils.book_append_sheet(workbook, productionSheet, 'Production Bouteilles');
      }

      // Feuille 3: Arrêts
      const arretsData: any[] = [];
      inventories.forEach((inv) => {
        inv.arrets?.forEach((arret) => {
          arretsData.push({
            Date: new Date(inv.date).toLocaleDateString('fr-FR'),
            Type: arret.type,
            'Durée (min)': arret.duree,
            Remarque: arret.remarque || '',
            'Créé par': arret.createdBy?.name || 'N/A',
            'Date création': new Date(arret.createdAt).toLocaleString('fr-FR')
          });
        });
      });

      if (arretsData.length > 0) {
        const arretsSheet = XLSX.utils.json_to_sheet(arretsData);
        XLSX.utils.book_append_sheet(workbook, arretsSheet, 'Arrêts Techniques');
      }

      // Générer le buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Retourner le fichier
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="production_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.xlsx"`
        }
      });
    } else if (format === 'pdf') {
      // Determine if we should use the dynamic template
      const hasDynamicConfig = productionCenter && (
        (productionCenter.approFieldConfigs?.length ?? 0) > 0 ||
        (productionCenter.sortieFieldConfigs?.length ?? 0) > 0 ||
        (productionCenter.reservoirs?.length ?? 0) > 0
      );

      let pdfBuffer;

      if (hasDynamicConfig && productionCenter) {
        // Serialize inventories to ensure all nested data is properly passed to PDF
        // This is necessary because react-pdf/renderer may not handle Prisma objects correctly
        const serializedInventories = JSON.parse(JSON.stringify(inventories));

        console.log('[Export API] Before serialization - first inventory sortieValues:', inventories[0]?.sortieValues);
        console.log('[Export API] After serialization - first inventory sortieValues:', serializedInventories[0]?.sortieValues);

        // Use dynamic template for configured centers
        pdfBuffer = await renderToBuffer(
          DynamicMonthlyProductionPDF({
            inventories: serializedInventories,
            startDate: start,
            endDate: end,
            productionCenter: {
              id: productionCenter.id,
              name: productionCenter.name,
              totalHourlyCapacity: productionCenter.totalHourlyCapacity,
              approFieldConfigs: productionCenter.approFieldConfigs,
              sortieFieldConfigs: productionCenter.sortieFieldConfigs,
              reservoirs: productionCenter.reservoirs
            },
            capaciteTotale,
            exportedByUser: session.user.name || undefined
          })
        );
      } else {
        // Use legacy template for unconfigured centers
        pdfBuffer = await renderToBuffer(
          MonthlyProductionPDF({
            inventories,
            startDate: start,
            endDate: end,
            productionCenter: productionCenter ? {
              id: productionCenter.id,
              name: productionCenter.name,
              address: productionCenter.address
            } : undefined,
            capaciteTotale,
            exportedByUser: session.user.name || undefined
          })
        );
      }

      const filename = `production_mensuelle_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Format invalide' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erreur export:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}