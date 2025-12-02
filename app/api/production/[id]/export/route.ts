import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { renderToBuffer } from '@react-pdf/renderer';
import ProductionInventoryPDF from '@/lib/pdf/ProductionInventoryPDF';
import QRCode from 'qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const inventoryId = parseInt(params.id);
    if (isNaN(inventoryId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'excel';

    // Récupérer l'inventaire avec toutes les relations
    const inventory = await prisma.productionInventory.findUnique({
      where: { id: inventoryId },
      include: {
        productionCenter: {
          select: { id: true, name: true, address: true }
        },
        startedBy: {
          select: { id: true, name: true, email: true }
        },
        completedBy: {
          select: { id: true, name: true, email: true }
        },
        arrets: {
          orderBy: { createdAt: 'asc' },
          include: {
            createdBy: { select: { id: true, name: true } }
          }
        },
        bottles: {
          orderBy: { type: 'asc' }
        },
        reservoirs: {
          orderBy: { name: 'asc' },
          include: {
            reservoirConfig: {
              select: { name: true, type: true, capacity: true }
            }
          }
        }
      }
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventaire non trouvé' }, { status: 404 });
    }

    // Fetch previous day's inventory for comparison
    const currentDate = new Date(inventory.date);
    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);

    const previousInventory = await prisma.productionInventory.findFirst({
      where: {
        date: previousDate,
        status: 'TERMINE',
        ...(inventory.productionCenterId && { productionCenterId: inventory.productionCenterId })
      },
      include: {
        reservoirs: {
          orderBy: { name: 'asc' },
          include: {
            reservoirConfig: {
              select: { name: true, type: true, capacity: true }
            }
          }
        }
      }
    });

    if (format === 'excel') {
      return generateExcelExport(inventory, previousInventory);
    } else if (format === 'pdf') {
      return generatePDFExport(inventory, previousInventory);
    } else {
      return NextResponse.json({ error: 'Format invalide' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erreur export:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function generateExcelExport(inventory: any, previousInventory: any = null) {
  const workbook = XLSX.utils.book_new();
  const date = new Date(inventory.date).toLocaleDateString('fr-FR');

  // Feuille 1: Informations générales
  const generalInfo = [
    ['INVENTAIRE DE PRODUCTION GPL'],
    [''],
    ['Date', date],
    ['Centre de production', inventory.productionCenter?.name || 'N/A'],
    ['Statut', inventory.status === 'TERMINE' ? 'Terminé' : 'En cours'],
    [''],
    ['Démarré par', inventory.startedBy?.name || 'N/A'],
    ['Date de début', new Date(inventory.startedAt).toLocaleString('fr-FR')],
    [''],
  ];

  if (inventory.completedBy) {
    generalInfo.push(
      ['Clôturé par', inventory.completedBy.name],
      ['Date de clôture', new Date(inventory.completedAt).toLocaleString('fr-FR')],
      ['']
    );
  }

  generalInfo.push(
    ['TEMPS DE PRODUCTION'],
    ['Temps total (min)', inventory.tempsTotal],
    ['Temps d\'arrêt (min)', inventory.tempsArret],
    ['Temps utile (min)', inventory.tempsUtile],
    ['Rendement (%)', inventory.rendement?.toFixed(2) || '0'],
    ['']
  );

  const generalSheet = XLSX.utils.aoa_to_sheet(generalInfo);
  XLSX.utils.book_append_sheet(workbook, generalSheet, 'Informations');

  // Feuille 2: Stocks et approvisionnements
  const stockData = [
    ['STOCKS ET APPROVISIONNEMENTS'],
    [''],
    ['Description', 'Valeur (Tonnes)'],
    ['Stock Initial Physique', inventory.stockInitialPhysique],
    ['Butanier', inventory.butanier || 0],
    ['Récupération', inventory.recuperation || 0],
    ['Appro SAR', inventory.approSAR || 0],
    [''],
    ['SORTIES'],
    ['Description', 'Quantité', 'Tonnage (T)'],
  ];

  // Add bottle production to sorties
  if (inventory.bottles && inventory.bottles.length > 0) {
    inventory.bottles.forEach((b: any) => {
      stockData.push([`Remplissage ${b.type}`, b.quantity, b.tonnage.toFixed(3)]);
    });
    const totalBottleTonnage = inventory.bottles.reduce((sum: number, b: any) => sum + b.tonnage, 0);
    stockData.push(['Sous-total Remplissage', '', totalBottleTonnage.toFixed(3)]);
    stockData.push(['']);
  }

  // Add other sorties
  stockData.push(
    ['Ngabou', '', (inventory.ngabou || 0).toFixed(3)],
    ['Exports', '', (inventory.exports || 0).toFixed(3)],
    ['Divers', '', (inventory.divers || 0).toFixed(3)],
    [''],
    ['CUMUL SORTIE (TOTAL)', '', (inventory.cumulSortie || 0).toFixed(3)],
    [''],
    ['STOCK FINAL'],
    ['Stock Final Théorique', '', (inventory.stockFinalTheorique?.toFixed(3) || '0')],
    ['Stock Final Physique', '', (inventory.stockFinalPhysique?.toFixed(3) || '0')],
    ['Écart', '', (inventory.ecart?.toFixed(3) || '0')],
    ['Écart (%)', '', (inventory.ecartPourcentage?.toFixed(2) + '%' || '0%')],
  );

  const stockSheet = XLSX.utils.aoa_to_sheet(stockData);
  XLSX.utils.book_append_sheet(workbook, stockSheet, 'Stocks');

  // Feuille 3: Production de bouteilles
  if (inventory.bottles && inventory.bottles.length > 0) {
    const bottleHeaders = ['Type de bouteille', 'Quantité', 'Tonnage (T)'];
    const bottleData = inventory.bottles.map((b: any) => [
      b.type,
      b.quantity,
      b.tonnage.toFixed(3)
    ]);

    const totalBottles = inventory.bottles.reduce((sum: number, b: any) => sum + b.quantity, 0);
    const totalTonnage = inventory.bottles.reduce((sum: number, b: any) => sum + b.tonnage, 0);

    bottleData.push(
      [''],
      ['TOTAL', totalBottles, totalTonnage.toFixed(3)]
    );

    const bottleSheet = XLSX.utils.aoa_to_sheet([
      ['PRODUCTION DE BOUTEILLES'],
      [''],
      bottleHeaders,
      ...bottleData
    ]);

    XLSX.utils.book_append_sheet(workbook, bottleSheet, 'Bouteilles');
  }

  // Feuille 4: Réservoirs (Sphères)
  if (inventory.reservoirs && inventory.reservoirs.length > 0) {
    const reservoirHeaders = [
      'Nom',
      'Type',
      'Capacité (m³)',
      'Hauteur (mm)',
      'Température (°C)',
      'Volume liquide (m³)',
      'Pression interne (bar)',
      'Densité à 15°C',
      'Facteur correction liquide',
      'Facteur correction vapeur',
      'Densité ambiante',
      'Poids liquide (T)',
      'Poids gaz (T)',
      'Poids total (T)'
    ];

    const reservoirData = inventory.reservoirs.map((r: any) => [
      r.name,
      r.reservoirConfig?.type || 'N/A',
      r.reservoirConfig?.capacity?.toFixed(2) || '0',
      r.hauteur,
      r.temperature,
      r.volumeLiquide.toFixed(3),
      r.pressionInterne,
      r.densiteA15C.toFixed(3),
      r.facteurCorrectionLiquide?.toFixed(5) || '0',
      r.facteurCorrectionVapeur?.toFixed(5) || '0',
      r.densiteAmbiante?.toFixed(5) || '0',
      r.poidsLiquide?.toFixed(3) || '0',
      r.poidsGaz?.toFixed(3) || '0',
      r.poidsTotal?.toFixed(3) || '0'
    ]);

    const totalPoidsLiquide = inventory.reservoirs.reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0);
    const totalPoidsGaz = inventory.reservoirs.reduce((sum: number, r: any) => sum + (r.poidsGaz || 0), 0);
    const totalPoids = inventory.reservoirs.reduce((sum: number, r: any) => sum + (r.poidsTotal || 0), 0);

    reservoirData.push(
      [''],
      ['TOTAL', '', '', '', '', '', '', '', '', '', '',
       totalPoidsLiquide.toFixed(3),
       totalPoidsGaz.toFixed(3),
       totalPoids.toFixed(3)]
    );

    const reservoirSheet = XLSX.utils.aoa_to_sheet([
      ['PESÉE DES RÉSERVOIRS DE GPL'],
      [''],
      reservoirHeaders,
      ...reservoirData
    ]);

    XLSX.utils.book_append_sheet(workbook, reservoirSheet, 'Réservoirs');
  }

  // Feuille 5: Arrêts techniques
  if (inventory.arrets && inventory.arrets.length > 0) {
    const arretHeaders = ['Type', 'Durée (min)', 'Remarque', 'Créé par', 'Date création'];
    const arretData = inventory.arrets.map((a: any) => [
      a.type,
      a.duree,
      a.remarque || '',
      a.createdBy?.name || 'N/A',
      new Date(a.createdAt).toLocaleString('fr-FR')
    ]);

    const totalDuree = inventory.arrets.reduce((sum: number, a: any) => sum + a.duree, 0);

    arretData.push(
      [''],
      ['TOTAL DURÉE ARRÊTS', totalDuree, '', '', '']
    );

    const arretSheet = XLSX.utils.aoa_to_sheet([
      ['ARRÊTS TECHNIQUES'],
      [''],
      arretHeaders,
      ...arretData
    ]);

    XLSX.utils.book_append_sheet(workbook, arretSheet, 'Arrêts');
  }

  // Observations
  if (inventory.observations) {
    const obsSheet = XLSX.utils.aoa_to_sheet([
      ['OBSERVATIONS'],
      [''],
      [inventory.observations]
    ]);
    XLSX.utils.book_append_sheet(workbook, obsSheet, 'Observations');
  }

  // Générer le buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Retourner le fichier
  const filename = `inventaire_production_${new Date(inventory.date).toISOString().split('T')[0]}.xlsx`;
  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}

async function generatePDFExport(inventory: any, previousInventory: any = null) {
  try {
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(
      `https://touba-app.com/dashboard/production/${inventory.id}`
    );

    // Render the PDF document to a buffer
    const pdfBuffer = await renderToBuffer(
      ProductionInventoryPDF({ inventory, previousInventory, qrCodeImage: qrCodeDataUrl })
    );

    const filename = `inventaire_production_${new Date(inventory.date).toISOString().split('T')[0]}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
