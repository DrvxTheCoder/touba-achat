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
    padding: 20,
    position: 'relative',
    fontFamily: 'Ubuntu',
    fontSize: 7,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Oswald',
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 3,
    color: '#666',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#000',
  },
  tableHeaderSection: {
    flexDirection: 'row',
    backgroundColor: '#4caf50',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
    minHeight: 18,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderTopWidth: 2,
    borderTopColor: '#000',
    fontFamily: 'Oswald',
  },
  // Column widths for different sections
  colDate: { width: '5%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 6 },
  colStockInit: { width: '5%', borderRightWidth: 1, borderRightColor: '#000', padding: 2, fontSize: 6 },

  // Approvisionnement section - 12% total, let columns flex within
  sectionAppro: { width: '12%', borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  colAppro: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#ccc', padding: 2, fontSize: 6 },

  // Sorties section - 50% total, let columns flex within
  sectionSorties: { width: '50%', borderRightWidth: 1, borderRightColor: '#000', flexDirection: 'row' },
  colSortie: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#ccc', padding: 2, fontSize: 6 },
  colCumulSortie: { flex: 1.2, borderRightWidth: 0.5, borderRightColor: '#ccc', padding: 2, fontSize: 6, fontFamily: 'Oswald' },

  // Stock section - 18% total, let columns flex within
  sectionStock: { width: '18%', flexDirection: 'row' },
  colStockFinal: { width: '100%', borderRightWidth: 0.5, borderRightColor: '#ccc', padding: 2, fontSize: 6 },
  colSphere: { width: '100%', borderRightWidth: 0.5, borderRightColor: '#ccc', padding: 2, fontSize: 6 },
  colCreux: { width: '50%', padding: 2, fontSize: 6 },

  // Header cells
  headerCell: {
    fontWeight: 'bold',
    color: '#fff',
    padding: 3,
    fontSize: 8,
    textAlign: 'center',
    fontFamily: 'Oswald',
  },
  headerCellSub: {
    fontWeight: 'bold',
    color: '#000',
    padding: 2,
    fontSize: 6,
    textAlign: 'center',
  },

  // Data cells
  cellText: {
    textAlign: 'right',
    fontSize: 6,
  },
  cellTextDate: {
    textAlign: 'center',
    fontSize: 6,
  },

  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
  },
});

interface MonthlyProductionPDFProps {
  inventories: any[];
  startDate: Date;
  endDate: Date;
  productionCenter?: any;
  capaciteTotale?: number;
}

const MonthlyProductionPDF = ({ inventories, startDate, endDate, productionCenter, capaciteTotale }: MonthlyProductionPDFProps): React.ReactElement<DocumentProps> => {
  // Get all unique bottle types from inventories
  const bottleTypes = Array.from(
    new Set(
      inventories.flatMap(inv =>
        inv.bottles?.map((b: any) => b.type) || []
      )
    )
  ).sort();

  // Get all unique reservoir names
  const reservoirNames = Array.from(
    new Set(
      inventories.flatMap(inv =>
        inv.reservoirs?.map((r: any) => r.name) || []
      )
    )
  ).sort();

  // Calculate totals
  const calculateTotal = (field: string) => {
    return inventories.reduce((sum, inv) => sum + (inv[field] || 0), 0);
  };

  const calculateBottleTotal = (bottleType: string) => {
    return inventories.reduce((sum, inv) => {
      const bottle = inv.bottles?.find((b: any) => b.type === bottleType);
      return sum + (bottle?.tonnage || 0);
    }, 0);
  };

  const calculateReservoirAvg = (reservoirName: string, field: 'hauteur' | 'poidsLiquide') => {
    const values = inventories
      .map(inv => inv.reservoirs?.find((r: any) => r.name === reservoirName)?.[field])
      .filter(v => v !== undefined && v !== null);

    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  // Use the capaciteTotale passed from the API (already in tonnes)
  // If not provided, calculate it from reservoir configs
  let totalCapacityTonnes = capaciteTotale || 0;

  if (!totalCapacityTonnes && inventories.length > 0) {
    // Fallback calculation if capaciteTotale not provided
    const allReservoirConfigs = new Map<string, number>();
    inventories.forEach(inv => {
      inv.reservoirs?.forEach((r: any) => {
        if (r.reservoirConfig && !allReservoirConfigs.has(r.name)) {
          allReservoirConfigs.set(r.name, r.reservoirConfig.capacity || 0);
        }
      });
    });
    const totalCapacityM3 = Array.from(allReservoirConfigs.values()).reduce((sum, cap) => sum + cap, 0);
    totalCapacityTonnes = totalCapacityM3 * 0.51;
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
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
              <Text style={styles.headerCell}>Date</Text>
            </View>
            <View style={[styles.colStockInit, { backgroundColor: 'transparent' }]}>
              <Text style={styles.headerCell}>Stock Init</Text>
            </View>

            {/* Approvisionnement Section */}
            <View style={styles.sectionAppro}>
              <Text style={styles.headerCell}>APPROVISIONNEMENT</Text>
            </View>

            {/* Sorties Section */}
            <View style={styles.sectionSorties}>
              <Text style={styles.headerCell}>SORTIES</Text>
            </View>

            {/* Stock Section */}
            <View style={styles.sectionStock}>
              <Text style={styles.headerCell}>STOCK</Text>
            </View>
          </View>

          {/* Column Headers (Row 2) */}
          <View style={styles.tableHeaderRow}>
            {/* Date - 5% */}
            <View style={styles.colDate}>
              <Text style={styles.headerCellSub}>Date</Text>
            </View>

            {/* Stock Initial - 5% */}
            <View style={styles.colStockInit}>
              <Text style={styles.headerCellSub}>VRAC (T)</Text>
            </View>

            {/* Appro section - 12% total */}
            <View style={styles.sectionAppro}>
              <View style={styles.colAppro}>
                <Text style={styles.headerCellSub}>Récup.</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={styles.headerCellSub}>SAR</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={styles.headerCellSub}>Butanier</Text>
              </View>
            </View>

            {/* Sorties section - 50% total */}
            <View style={styles.sectionSorties}>
              <View style={styles.colSortie}>
                <Text style={styles.headerCellSub}>Ngabou</Text>
              </View>
              <View style={styles.colSortie}>
                <Text style={styles.headerCellSub}>Export</Text>
              </View>
              <View style={styles.colSortie}>
                <Text style={styles.headerCellSub}>Divers</Text>
              </View>

              {/* Bottle type columns */}
              {bottleTypes.map((type, idx) => (
                <View key={idx} style={styles.colSortie}>
                  <Text style={styles.headerCellSub}>{type.replace('_', '.')}</Text>
                </View>
              ))}

              <View style={styles.colCumulSortie}>
                <Text style={[styles.headerCellSub, { fontFamily: 'Oswald' }]}>Cumul</Text>
              </View>
            </View>

            {/* Stock section - 18% total */}
            <View style={styles.sectionStock}>
              <View style={styles.colStockFinal}>
                <Text style={styles.headerCellSub}>Stock Théorique</Text>
              </View>

              {/* Reservoir columns */}
              {reservoirNames.map((name, idx) => (
                <View key={idx} style={styles.colSphere}>
                  <Text style={styles.headerCellSub}>{name}</Text>
                </View>
              ))}

              <View style={styles.colStockFinal}>
                <Text style={styles.headerCellSub}>SF Phys.</Text>
              </View>
              <View style={styles.colCreux}>
                <Text style={styles.headerCellSub}>Creux</Text>
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
                <Text style={styles.cellText}>{inventory.stockInitialPhysique?.toFixed(2) || '0.00'}</Text>
              </View>

              {/* Approvisionnement section */}
              <View style={styles.sectionAppro}>
                <View style={styles.colAppro}>
                  <Text style={styles.cellText}>{(inventory.recuperation || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.colAppro}>
                  <Text style={styles.cellText}>{(inventory.approSAR || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.colAppro}>
                  <Text style={styles.cellText}>{(inventory.butanier || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Sorties section */}
              <View style={styles.sectionSorties}>
                <View style={styles.colSortie}>
                  <Text style={styles.cellText}>{(inventory.ngabou || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.colSortie}>
                  <Text style={styles.cellText}>{(inventory.exports || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.colSortie}>
                  <Text style={styles.cellText}>{(inventory.divers || 0).toFixed(2)}</Text>
                </View>

                {/* Bottle types */}
                {bottleTypes.map((type, typeIdx) => {
                  const bottle = inventory.bottles?.find((b: any) => b.type === type);
                  return (
                    <View key={typeIdx} style={styles.colSortie}>
                      <Text style={styles.cellText}>{bottle?.quantity || '0'}</Text>
                    </View>
                  );
                })}

                {/* Cumul Sorties */}
                <View style={styles.colCumulSortie}>
                  <Text style={[styles.cellText, { fontFamily: 'Oswald' }]}>
                    {(inventory.cumulSortie || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Stock section */}
              <View style={styles.sectionStock}>
                {/* Stock Final Théorique */}
                <View style={styles.colStockFinal}>
                  <Text style={styles.cellText}>{(inventory.stockFinalTheorique || 0).toFixed(2)}</Text>
                </View>

                {/* Reservoirs (Hauteur & Poids) */}
                {reservoirNames.map((name, resIdx) => {
                  const reservoir = inventory.reservoirs?.find((r: any) => r.name === name);
                  return (
                    <View key={resIdx} style={styles.colSphere}>
                      <Text style={styles.cellText}>
                        {reservoir ? `${reservoir.poidsLiquide?.toFixed(3) || '0.000'}T` : '-'}
                        {/* {reservoir ? `${reservoir.hauteur}mm / ${reservoir.poidsLiquide?.toFixed(1) || '0.0'}T` : '-'} */}
                      </Text>
                    </View>
                  );
                })}

                {/* Stock Final Physique */}
                <View style={styles.colStockFinal}>
                  <Text style={styles.cellText}>{(inventory.stockFinalPhysique || 0).toFixed(2)}</Text>
                </View>

                {/* Creux */}
                <View style={styles.colCreux}>
                  <Text style={styles.cellText}>
                    {(totalCapacityTonnes - (inventory.stockFinalPhysique || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.tableTotalRow}>
            <View style={styles.colDate}>
              <Text style={[styles.cellText, { fontFamily: 'Oswald', fontSize: 7 }]}>TOTAL</Text>
            </View>
            <View style={styles.colStockInit}>
              <Text style={styles.cellText}>-</Text>
            </View>

            {/* Appro Totals */}
            <View style={styles.sectionAppro}>
              <View style={styles.colAppro}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateTotal('recuperation').toFixed(2)}</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateTotal('approSAR').toFixed(2)}</Text>
              </View>
              <View style={styles.colAppro}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateTotal('butanier').toFixed(2)}</Text>
              </View>
            </View>

            {/* Sorties Totals */}
            <View style={styles.sectionSorties}>
              <View style={styles.colSortie}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateTotal('ngabou').toFixed(2)}</Text>
              </View>
              <View style={styles.colSortie}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateTotal('exports').toFixed(2)}</Text>
              </View>
              <View style={styles.colSortie}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateTotal('divers').toFixed(2)}</Text>
              </View>

              {/* Bottle type totals */}
              {bottleTypes.map((type, typeIdx) => (
                <View key={typeIdx} style={styles.colSortie}>
                  <Text style={[styles.cellText, { fontSize: 7 }]}>{calculateBottleTotal(type).toFixed(2)}</Text>
                </View>
              ))}

              {/* Cumul Total */}
              <View style={styles.colCumulSortie}>
                <Text style={[styles.cellText, { fontFamily: 'Oswald', fontSize: 7 }]}>
                  {calculateTotal('cumulSortie').toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Stock columns - show averages for reservoirs */}
            <View style={styles.sectionStock}>
              <View style={styles.colStockFinal}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>-</Text>
              </View>

              {reservoirNames.map((name, resIdx) => (
                <View key={resIdx} style={styles.colSphere}>
                  <Text style={[styles.cellText, { fontSize: 6 }]}>
                    {/* {calculateReservoirAvg(name, 'hauteur').toFixed(0)}mm /
                    {calculateReservoirAvg(name, 'poidsLiquide').toFixed(3)}T */}
                    -
                  </Text>
                </View>
              ))}

              <View style={styles.colStockFinal}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>-</Text>
              </View>
              <View style={styles.colCreux}>
                <Text style={[styles.cellText, { fontSize: 7 }]}>-</Text>
              </View>
            </View>
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
