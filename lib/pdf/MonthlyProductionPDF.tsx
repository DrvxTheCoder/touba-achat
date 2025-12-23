import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, DocumentProps } from '@react-pdf/renderer';

const pageURL = "https://touba-app.com";

// Register fonts
Font.register({
  family: 'Ubuntu',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf',
      fontWeight: 'normal',
    },
  ],
});

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 15,
    paddingTop: 30, // Extra space for logo
    paddingBottom: 35, // Extra space for footer signatures
    position: 'relative',
    fontFamily: 'Ubuntu',
    fontSize: 7,
  },
  logo: {
    position: 'absolute',
    top: 10,
    left: 15,
    height: 30,
  },
  logoTwo: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 30,
    height: 30,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '40%',
    transform: 'translate(-50%, -50%)',
    opacity: 0.05,
    width: 300
  },
  header: {
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Oswald',
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 3,
    color: '#666',
    textAlign: 'center',
  },

  // --- TABLE STYLING ---
  table: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  tableHeaderSection: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    minHeight: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    minHeight: 11,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    minHeight: 12,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#c8e6c9',
    borderTopWidth: 2,
    borderTopColor: '#4caf50',
    fontFamily: 'Oswald',
    minHeight: 12,
  },

  // Increased column widths proportionately (except rendement)
  colDate: { width: '3.5%', borderRightWidth: 1, borderRightColor: '#ddd', fontSize: 5 },
  colStockInit: { width: '5%', borderRightWidth: 1, borderRightColor: '#ddd', fontSize: 5 },

  // Approvisionnement section - 11% (was 9%)
  sectionAppro: { width: '11%', borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' },
  colAppro: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },

  // Sorties VRAC section - 10% (was 8%)
  sectionSortiesVrac: { width: '15%', borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' },
  colSortieVrac: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },

  // Sorties Conditionnées section - 34% (was 28%)
  sectionSortiesConditionees: { width: '29%', borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' },
  colBottle: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },
  colCumulSortie: { flex: 1.2, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5, fontFamily: 'Oswald' },

  // Stock Final section - 25% (reduced to make room for Rendement)
  sectionStockFinal: { width: '25%', borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' },
  colStockFinal: { flex: 1.2, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },
  colSphere: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },
  colEcart: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },
  colCreux: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },

  // Rendement section - 14% (increased to fit new column)
  sectionRendement: { width: '14%', flexDirection: 'row' },
  colRendement: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 },
  colRendementLast: { flex: 1, padding: 1, fontSize: 5 },

  // Header cells
  headerCell: {
    fontWeight: 'bold',
    color: '#000',
    padding: 2,
    fontSize: 7,
    textAlign: 'center',
    fontFamily: 'Oswald',
    flex: 1,
  },
  headerCellSub: {
    fontWeight: 'bold',
    color: '#000',
    padding: 1,
    fontSize: 5,
    textAlign: 'center',
    lineHeight: 1.1,
  },

  // Data cells - tightened line height
  cellText: {
    textAlign: 'center',
    fontSize: 6,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.1,
    paddingVertical: 1,
  },
  cellTextDate: {
    textAlign: 'center',
    fontSize: 6,
    lineHeight: 1.1,
    paddingVertical: 1,
  },

  // Footer with signatures
  footerSignatures: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
  },
  signatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signatureLabel: {
    marginRight: 5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 100,
    marginLeft: 5,
  },

  footer: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    right: 15,
    textAlign: 'center',
    fontSize: 6,
    color: '#999',
  },
});

interface MonthlyProductionPDFProps {
  inventories: any[];
  startDate: Date;
  endDate: Date;
  productionCenter?: any;
  capaciteTotale?: number;
  exportedByUser?: string;
}

const MonthlyProductionPDF = ({ inventories, startDate, endDate, productionCenter, capaciteTotale, exportedByUser }: MonthlyProductionPDFProps): React.ReactElement<DocumentProps> => {
  // Get all unique bottle types from inventories
  const bottleTypes = Array.from(
    new Set(
      inventories.flatMap(inv =>
        inv.bottles?.map((b: any) => b.type) || []
      )
    )
  ).sort();

  // Fixed reservoir names
  const reservoirNames = ['D100', 'SO2', 'SO3'];

  // Calculate totals
  const calculateTotal = (field: string) => {
    return inventories.reduce((sum, inv) => sum + (inv[field] || 0), 0);
  };

  const calculateBottleTotal = (bottleType: string) => {
    return inventories.reduce((sum, inv) => {
      const bottle = inv.bottles?.find((b: any) => b.type === bottleType);
      return sum + (bottle?.quantity || 0);
    }, 0);
  };

  // Use the capaciteTotale passed from the API (already in tonnes)
  let totalCapacityTonnes = capaciteTotale || 0;

  if (!totalCapacityTonnes && inventories.length > 0) {
    totalCapacityTonnes = 4993.47;
  }

  // Helper function to convert minutes to hours with H separator
  const convertMinutesToHours = (minutes: number): string => {
    const totalHours = minutes / 60;
    const hours = Math.floor(totalHours);
    const mins = Math.round((totalHours - hours) * 60);
    return `${hours}H${mins.toString().padStart(2, '0')}`;
  };

  // Calculate total bottles produced
  const calculateTotalBottles = () => {
    return inventories.reduce((sum, inv) => sum + (inv.totalBottlesProduced || 0), 0);
  };

  // Calculate Rendement Horaire for a single inventory (in T/hour)
  // Only uses bottles produced in tonnes, excludes ngabou, exports, divers
  // Uses TU (Temps Utile) instead of THT (Total Heures Travaillé)
  const calculateRendementHoraire = (inventory: any): string => {
    if (!inventory.tempsUtile || inventory.tempsUtile === 0) return '-';

    // Calculate total bottles tonnage only
    const totalBottlesTonnage = inventory.bottles?.reduce((sum: number, bottle: any) => {
      return sum + (bottle.tonnage || 0);
    }, 0) || 0;

    const hoursWorked = inventory.tempsUtile / 60;
    return (totalBottlesTonnage / hoursWorked).toFixed(2);
  };

  // Calculate percentage of RH over 24T ideal production
  const calculatePercentage24T = (inventory: any): string => {
    if (!inventory.tempsUtile || inventory.tempsUtile === 0) return '-';

    // Calculate total bottles tonnage only
    const totalBottlesTonnage = inventory.bottles?.reduce((sum: number, bottle: any) => {
      return sum + (bottle.tonnage || 0);
    }, 0) || 0;

    const hoursWorked = inventory.tempsUtile / 60;
    const rendementHoraire = totalBottlesTonnage / hoursWorked;
    const percentage = (rendementHoraire / 24) * 100;
    return percentage.toFixed(2);
  };

  // Calculate average Creux
  const calculateAverageCreux = () => {
    const totalCreux = inventories.reduce((sum, inv) => {
      const creux = totalCapacityTonnes - (inv.stockFinalPhysique || 0);
      return sum + creux;
    }, 0);
    return inventories.length > 0 ? (totalCreux / inventories.length).toFixed(3) : '0.000';
  };

  // Dynamic column styles for stock final
  const colStockFinalStyle = { flex: 1.2, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 };
  const colSphereStyle = { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 };
  const colEcartStyle = { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 };
  const colCreuxStyle = { flex: 1, borderRightWidth: 0.5, borderRightColor: '#e0e0e0', padding: 1, fontSize: 5 };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Logo */}
        <Image style={styles.logo} src="https://touba-app.com/assets/img/TGAZ.png" />
        <Image style={styles.logoTwo} src="https://touba-app.com/assets/img/touba-app512x512-1.png" />

        {/* Watermark */}
        <Image style={styles.watermark} src="https://touba-app.com/assets/img/touba-app512x512-1.png" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>RAPPORT MENSUEL DE PRODUCTION GPL</Text>
          <Text style={styles.subtitle}>
            {productionCenter?.name || 'Centre de production'}
            {' - '}
            Période: {startDate.toLocaleDateString('fr-FR')} au {endDate.toLocaleDateString('fr-FR')}
          </Text>
        </View>

        {/* Main Table */}
        <View style={styles.table}>
          {/* Section Headers (Row 1) */}
          <View style={styles.tableHeaderSection}>
            <View style={[styles.colDate, { backgroundColor: 'transparent' }]}>
              <Text style={styles.headerCell}>DATE</Text>
            </View>
            <View style={[styles.colStockInit, { backgroundColor: 'transparent' }]}>
              <Text style={styles.headerCell}>STOCK INIT</Text>
            </View>

            {/* Approvisionnement Section */}
            <View style={styles.sectionAppro}>
              <Text style={styles.headerCell}>APPROVISIONNEMENTS</Text>
            </View>

            {/* Sorties VRAC Section */}
            <View style={styles.sectionSortiesVrac}>
              <Text style={styles.headerCell}>SORTIES VRAC</Text>
            </View>

            {/* Sorties Conditionnées Section */}
            <View style={styles.sectionSortiesConditionees}>
              <Text style={styles.headerCell}>SORTIES CONDITIONNÉES</Text>
            </View>

            {/* Stock Final Section */}
            <View style={styles.sectionStockFinal}>
              <Text style={styles.headerCell}>STOCK FINAL</Text>
            </View>

            {/* Rendement Section */}
            <View style={styles.sectionRendement}>
              <Text style={styles.headerCell}>RENDEMENT</Text>
            </View>
          </View>

          {/* Column Headers (Row 2) */}
          <View style={styles.tableHeaderRow}>
            {/* Date */}
            <View style={styles.colDate}>
              <Text style={styles.headerCellSub}>Date</Text>
            </View>

            {/* Stock Initial */}
            <View style={styles.colStockInit}>
              <Text style={styles.headerCellSub}>VRAC (T)</Text>
            </View>

            {/* Appro section */}
            <View style={styles.sectionAppro}>
              <View style={styles.colAppro}>
                <Text style={styles.headerCellSub}>Récup.</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={styles.headerCellSub}>SAR</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={styles.headerCellSub}>Butan.</Text>
              </View>
            </View>

            {/* Sorties VRAC section */}
            <View style={styles.sectionSortiesVrac}>
              <View style={styles.colSortieVrac}>
                <Text style={styles.headerCellSub}>Ngabou</Text>
              </View>
              <View style={styles.colSortieVrac}>
                <Text style={styles.headerCellSub}>Export</Text>
              </View>
              <View style={styles.colSortieVrac}>
                <Text style={styles.headerCellSub}>Divers</Text>
              </View>
            </View>

            {/* Sorties Conditionnées section */}
            <View style={styles.sectionSortiesConditionees}>
              {/* Bottle type columns */}
              {bottleTypes.map((type, idx) => (
                <View key={idx} style={styles.colBottle}>
                  <Text style={styles.headerCellSub}>{type.replace('_', '.')}</Text>
                </View>
              ))}

              <View style={styles.colCumulSortie}>
                <Text style={[styles.headerCellSub, { fontFamily: 'Oswald' }]}>Cumul (T)</Text>
              </View>
            </View>

            {/* Stock Final section */}
            <View style={styles.sectionStockFinal}>
              <View style={colStockFinalStyle}>
                <Text style={styles.headerCellSub}>ST (T)</Text>
              </View>

              {/* Reservoir columns */}
              {reservoirNames.map((name, idx) => (
                <View key={idx} style={colSphereStyle}>
                  <Text style={styles.headerCellSub}>{name}</Text>
                </View>
              ))}

              <View style={colStockFinalStyle}>
                <Text style={styles.headerCellSub}>SFP (T)</Text>
              </View>
              <View style={colEcartStyle}>
                <Text style={styles.headerCellSub}>Écart</Text>
              </View>
              <View style={colCreuxStyle}>
                <Text style={styles.headerCellSub}>Creux</Text>
              </View>
            </View>

            {/* Rendement section */}
            <View style={styles.sectionRendement}>
              <View style={styles.colRendement}>
                <Text style={styles.headerCellSub}>THT (h)</Text>
              </View>
              <View style={styles.colRendement}>
                <Text style={styles.headerCellSub}>TA (min)</Text>
              </View>
              <View style={styles.colRendement}>
                <Text style={styles.headerCellSub}>TU (h)</Text>
              </View>
              <View style={styles.colRendement}>
                <Text style={styles.headerCellSub}>RH (T/h)</Text>
              </View>
              <View style={styles.colRendementLast}>
                <Text style={styles.headerCellSub}>% 24T</Text>
              </View>
            </View>
          </View>

          {/* Data Rows */}
          {inventories.map((inventory, idx) => (
            <View key={idx} style={styles.tableRow}>
              {/* Date */}
              <View style={styles.colDate}>
                <Text style={styles.cellTextDate}>
                  {new Date(inventory.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </Text>
              </View>

              {/* Stock Initial */}
              <View style={styles.colStockInit}>
                <Text style={styles.cellText}>{inventory.stockInitialPhysique?.toFixed(3) || '0.00'}</Text>
              </View>

              {/* Approvisionnement section */}
              <View style={styles.sectionAppro}>
                <View style={styles.colAppro}>
                  <Text style={styles.cellText}>{(inventory.recuperation || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.colAppro}>
                  <Text style={styles.cellText}>{(inventory.approSAR || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.colAppro}>
                  <Text style={styles.cellText}>{(inventory.butanier || 0).toFixed(3)}</Text>
                </View>
              </View>

              {/* Sorties VRAC section */}
              <View style={styles.sectionSortiesVrac}>
                <View style={styles.colSortieVrac}>
                  <Text style={styles.cellText}>{(inventory.ngabou || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.colSortieVrac}>
                  <Text style={styles.cellText}>{(inventory.exports || 0).toFixed(3)}</Text>
                </View>
                <View style={styles.colSortieVrac}>
                  <Text style={styles.cellText}>{(inventory.divers || 0).toFixed(3)}</Text>
                </View>
              </View>

              {/* Sorties Conditionnées section */}
              <View style={styles.sectionSortiesConditionees}>
                {/* Bottle types */}
                {bottleTypes.map((type, typeIdx) => {
                  const bottle = inventory.bottles?.find((b: any) => b.type === type);
                  return (
                    <View key={typeIdx} style={styles.colBottle}>
                      <Text style={styles.cellText}>{bottle?.quantity || '0'}</Text>
                    </View>
                  );
                })}

                {/* Cumul Sorties */}
                <View style={styles.colCumulSortie}>
                  <Text style={[styles.cellText, { fontFamily: 'Oswald' }]}>
                    {(inventory.cumulSortie || 0).toFixed(3)}
                  </Text>
                </View>
              </View>

              {/* Stock Final section */}
              <View style={styles.sectionStockFinal}>
                {/* Stock Théorique */}
                <View style={colStockFinalStyle}>
                  <Text style={styles.cellText}>{(inventory.stockFinalTheorique || 0).toFixed(3)}</Text>
                </View>

                {/* Reservoirs */}
                {reservoirNames.map((name, resIdx) => {
                  const reservoir = inventory.reservoirs?.find((r: any) => r.name === name);
                  return (
                    <View key={resIdx} style={colSphereStyle}>
                      <Text style={styles.cellText}>
                        {reservoir ? `${reservoir.poidsLiquide?.toFixed(3) || '0.00'}` : '-'}
                      </Text>
                    </View>
                  );
                })}

                {/* Stock Final Physique */}
                <View style={colStockFinalStyle}>
                  <Text style={styles.cellText}>{(inventory.stockFinalPhysique || 0).toFixed(3)}</Text>
                </View>

                {/* Écart */}
                <View style={colEcartStyle}>
                  <Text style={styles.cellText}>
                    {(inventory.ecart || 0).toFixed(3)}
                  </Text>
                </View>

                {/* Creux */}
                <View style={colCreuxStyle}>
                  <Text style={styles.cellText}>
                    {(totalCapacityTonnes - (inventory.stockFinalPhysique || 0)).toFixed(3)}
                  </Text>
                </View>
              </View>

              {/* Rendement section */}
              <View style={styles.sectionRendement}>
                <View style={styles.colRendement}>
                  <Text style={styles.cellText}>{convertMinutesToHours(inventory.tempsTotal || 0)}</Text>
                </View>
                <View style={styles.colRendement}>
                  <Text style={styles.cellText}>{inventory.tempsArret || '0'}</Text>
                </View>
                <View style={styles.colRendement}>
                  <Text style={styles.cellText}>{convertMinutesToHours(inventory.tempsUtile || 0)}</Text>
                </View>
                <View style={styles.colRendement}>
                  <Text style={styles.cellText}>
                    {calculateRendementHoraire(inventory)}
                  </Text>
                </View>
                <View style={styles.colRendementLast}>
                  <Text style={styles.cellText}>
                    {calculatePercentage24T(inventory)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.tableTotalRow}>
            <View style={styles.colDate}>
              <Text style={[styles.cellText, { fontFamily: 'Oswald', fontSize: 6, textAlign: 'center' }]}>TOTAL</Text>
            </View>
            <View style={styles.colStockInit}>
              <Text style={[styles.cellText, { textAlign: 'center' }]}>-</Text>
            </View>

            {/* Appro Totals */}
            <View style={styles.sectionAppro}>
              <View style={styles.colAppro}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('recuperation').toFixed(3)}</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('approSAR').toFixed(3)}</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('butanier').toFixed(3)}</Text>
              </View>
            </View>

            {/* Sorties VRAC Totals */}
            <View style={styles.sectionSortiesVrac}>
              <View style={styles.colSortieVrac}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('ngabou').toFixed(3)}</Text>
              </View>
              <View style={styles.colSortieVrac}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('exports').toFixed(3)}</Text>
              </View>
              <View style={styles.colSortieVrac}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('divers').toFixed(3)}</Text>
              </View>
            </View>

            {/* Sorties Conditionnées Totals */}
            <View style={styles.sectionSortiesConditionees}>
              {/* Bottle type totals */}
              {bottleTypes.map((type, typeIdx) => (
                <View key={typeIdx} style={styles.colBottle}>
                  <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateBottleTotal(type).toFixed(0)}</Text>
                </View>
              ))}

              {/* Cumul Total */}
              <View style={styles.colCumulSortie}>
                <Text style={[styles.cellText, { fontFamily: 'Oswald', fontSize: 6 }]}>
                  {calculateTotal('cumulSortie').toFixed(3)}
                </Text>
              </View>
            </View>

            {/* Stock Final Totals */}
            <View style={styles.sectionStockFinal}>
              <View style={colStockFinalStyle}>
                <Text style={[styles.cellText, { fontSize: 6, textAlign: 'center' }]}>-</Text>
              </View>

              {reservoirNames.map((name, resIdx) => (
                <View key={resIdx} style={colSphereStyle}>
                  <Text style={[styles.cellText, { fontSize: 5, textAlign: 'center' }]}>-</Text>
                </View>
              ))}

              <View style={colStockFinalStyle}>
                <Text style={[styles.cellText, { fontSize: 6, textAlign: 'center' }]}>-</Text>
              </View>
              <View style={colEcartStyle}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('ecart').toFixed(3)}</Text>
              </View>
              <View style={colCreuxStyle}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateAverageCreux()}</Text>
              </View>
            </View>

            {/* Rendement Totals */}
            <View style={styles.sectionRendement}>
              <View style={styles.colRendement}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {convertMinutesToHours(calculateTotal('tempsTotal'))}
                </Text>
              </View>
              <View style={styles.colRendement}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('tempsArret').toFixed(0)}</Text>
              </View>
              <View style={styles.colRendement}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {convertMinutesToHours(calculateTotal('tempsUtile'))}
                </Text>
              </View>
              <View style={styles.colRendement}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {(() => {
                    const totalTempsUtile = calculateTotal('tempsUtile');
                    if (!totalTempsUtile || totalTempsUtile === 0) return '-';

                    // Calculate total bottles tonnage across all inventories
                    const totalBottlesTonnage = inventories.reduce((sum, inv) => {
                      const invBottlesTonnage = inv.bottles?.reduce((bottleSum: number, bottle: any) => {
                        return bottleSum + (bottle.tonnage || 0);
                      }, 0) || 0;
                      return sum + invBottlesTonnage;
                    }, 0);

                    const totalHoursWorked = totalTempsUtile / 60;
                    return (totalBottlesTonnage / totalHoursWorked).toFixed(2);
                  })()}
                </Text>
              </View>
              <View style={styles.colRendementLast}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {(() => {
                    const totalTempsUtile = calculateTotal('tempsUtile');
                    if (!totalTempsUtile || totalTempsUtile === 0) return '-';

                    // Calculate total bottles tonnage across all inventories
                    const totalBottlesTonnage = inventories.reduce((sum, inv) => {
                      const invBottlesTonnage = inv.bottles?.reduce((bottleSum: number, bottle: any) => {
                        return bottleSum + (bottle.tonnage || 0);
                      }, 0) || 0;
                      return sum + invBottlesTonnage;
                    }, 0);

                    const totalHoursWorked = totalTempsUtile / 60;
                    const rendementHoraire = totalBottlesTonnage / totalHoursWorked;
                    const percentage = (rendementHoraire / 24) * 100;
                    return percentage.toFixed(2) + '%';
                  })()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Signatures */}
        <View style={styles.footerSignatures}>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureLabel}>VISA PRODUCTION: {exportedByUser || '_____________'}</Text>
          </View>
          <View style={styles.signatureItem}>
            <Text style={styles.signatureLabel}>Chef de Centre: _____________</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré le {new Date().toLocaleString('fr-FR')} - ToubaApp™
        </Text>
      </Page>
    </Document>
  );
};

export default MonthlyProductionPDF;
