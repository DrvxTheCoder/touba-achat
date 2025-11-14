// app/api/production/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!session.user.access?.includes('EXPORT_PRODUCTION_REPORTS')) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    const { format, startDate, endDate } = await req.json();

    // Validation
    if (!format || !['excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();

    // Récupérer les données
    const inventories = await prisma.productionInventory.findMany({
      where: {
        date: { gte: start, lte: end },
        status: 'TERMINE'
      },
      orderBy: { date: 'asc' },
      include: {
        bottles: true,
        spheres: true,
        arrets: true,
        startedBy: { select: { name: true } },
        completedBy: { select: { name: true } }
      }
    });

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
            Début: new Date(arret.heureDebut).toLocaleTimeString('fr-FR'),
            Fin: new Date(arret.heureFin).toLocaleTimeString('fr-FR'),
            'Durée (min)': arret.duree,
            Remarque: arret.remarque || ''
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
    } else {
      // TODO: Implémenter l'export PDF avec une librairie comme PDFKit ou jsPDF
      return NextResponse.json(
        { error: 'Export PDF non implémenté pour le moment' },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error('Erreur export:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}