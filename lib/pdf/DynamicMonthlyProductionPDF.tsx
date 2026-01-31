import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, DocumentProps } from '@react-pdf/renderer';

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

// Interfaces
interface ApproFieldConfig {
  id: number;
  name: string;
  label: string;
  order: number;
}

interface SortieFieldConfig {
  id: number;
  name: string;
  label: string;
  order: number;
}

interface ReservoirConfig {
  id: number;
  name: string;
  type: string;
  capacity: number;
  capacityTonnes?: number | null;
}

interface CenterConfig {
  id: number;
  name: string;
  totalHourlyCapacity: number;
  approFieldConfigs: ApproFieldConfig[];
  sortieFieldConfigs: SortieFieldConfig[];
  reservoirs: ReservoirConfig[];
}

interface DynamicMonthlyProductionPDFProps {
  inventories: any[];
  startDate: Date;
  endDate: Date;
  productionCenter: CenterConfig;
  capaciteTotale?: number;
  exportedByUser?: string;
}

// Base styles
const styles = StyleSheet.create({
  page: {
    padding: 15,
    paddingTop: 30,
    paddingBottom: 35,
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

const DynamicMonthlyProductionPDF = ({
  inventories,
  startDate,
  endDate,
  productionCenter,
  capaciteTotale,
  exportedByUser
}: DynamicMonthlyProductionPDFProps): React.ReactElement<DocumentProps> => {
  // Debug: Log what we received
  console.log('[PDF Component] Received inventories count:', inventories?.length);
  if (inventories && inventories.length > 0) {
    console.log('[PDF Component] First inventory has approValues?', !!inventories[0].approValues);
    console.log('[PDF Component] First inventory has sortieValues?', !!inventories[0].sortieValues);
    console.log('[PDF Component] First inventory approValues:', inventories[0].approValues);
    console.log('[PDF Component] First inventory sortieValues:', inventories[0].sortieValues);
  }

  // Dynamic section visibility
  const approFields = productionCenter.approFieldConfigs || [];
  const sortieFields = productionCenter.sortieFieldConfigs || [];
  const reservoirs = productionCenter.reservoirs || [];

  const showApproSection = approFields.length > 0;
  const showSortieSection = sortieFields.length > 0;
  const showReservoirColumns = reservoirs.length > 0;

  // Get all unique bottle types from inventories
  const bottleTypes = Array.from(
    new Set(
      inventories.flatMap(inv =>
        inv.bottles?.map((b: any) => b.type) || []
      )
    )
  ).sort();

  // Calculate total capacity in tonnes from reservoir configurations
  // Use capacityTonnes from reservoirs, fallback to estimating from m³ (capacity * 0.5), then to capaciteTotale prop
  const calculatedCapacity = reservoirs.reduce((sum, res) => {
    // Use capacityTonnes if available, otherwise estimate from m³ (roughly 0.5 T/m³ for LPG)
    const tonnes = res.capacityTonnes ?? (res.capacity * 0.5);
    return sum + tonnes;
  }, 0);
  const totalCapacityTonnes = calculatedCapacity > 0 ? calculatedCapacity : (capaciteTotale || 0);

  // Hourly capacity for rendement calculation
  const hourlyCapacity = productionCenter.totalHourlyCapacity || 24;

  // Calculate dynamic widths
  const calculateWidths = () => {
    const dateWidth = 3.5;
    const stockInitWidth = 5;
    const rendementWidth = 14;
    const stockFinalBaseWidth = 12; // ST, SFP, Écart, Creux (4 columns)

    const approCols = approFields.length;
    const sortieCols = sortieFields.length;
    const reservoirCols = reservoirs.length;
    const bottleCols = Math.max(bottleTypes.length, 1) + 1; // +1 for Cumul

    const fixedWidth = dateWidth + stockInitWidth + stockFinalBaseWidth + rendementWidth;
    const remainingWidth = 100 - fixedWidth;

    // Calculate total dynamic columns
    const totalDynamicCols = approCols + sortieCols + bottleCols + reservoirCols;

    if (totalDynamicCols === 0) {
      return {
        approWidth: 0,
        sortieWidth: 0,
        bottleWidth: remainingWidth,
        reservoirWidth: 0,
      };
    }

    const colUnit = remainingWidth / totalDynamicCols;

    return {
      approWidth: approCols * colUnit,
      sortieWidth: sortieCols * colUnit,
      bottleWidth: bottleCols * colUnit,
      reservoirWidth: reservoirCols * colUnit,
    };
  };

  const widths = calculateWidths();

  // Value extraction helpers
  const getApproValue = (inventory: any, fieldName: string): number => {
    const value = inventory.approValues?.find(
      (av: any) => av.fieldConfig?.name === fieldName
    );
    // Debug logging
    if (fieldName === 'butanier' && inventory.approValues) {
      console.log(`[PDF] Checking approValue for ${fieldName}:`, {
        approValuesCount: inventory.approValues.length,
        approValues: inventory.approValues,
        foundValue: value,
        result: value?.value ?? 0
      });
    }
    return value?.value ?? 0;
  };

  const getSortieValue = (inventory: any, fieldName: string): number => {
    const value = inventory.sortieValues?.find(
      (sv: any) => sv.fieldConfig?.name === fieldName
    );
    // Debug logging
    if (fieldName === 'ngabou' && inventory.sortieValues) {
      console.log(`[PDF] Checking sortieValue for ${fieldName}:`, {
        sortieValuesCount: inventory.sortieValues.length,
        sortieValues: inventory.sortieValues,
        foundValue: value,
        result: value?.value ?? 0
      });
    }
    return value?.value ?? 0;
  };

  const getReservoirWeight = (inventory: any, reservoirName: string): number => {
    const reservoir = inventory.reservoirs?.find(
      (r: any) => r.name === reservoirName
    );
    return reservoir?.poidsLiquide ?? 0;
  };

  // Calculate totals
  const calculateApproTotal = (fieldName: string): number => {
    return inventories.reduce((sum, inv) => sum + getApproValue(inv, fieldName), 0);
  };

  const calculateSortieTotal = (fieldName: string): number => {
    return inventories.reduce((sum, inv) => sum + getSortieValue(inv, fieldName), 0);
  };

  const calculateBottleTotal = (bottleType: string): number => {
    return inventories.reduce((sum, inv) => {
      const bottle = inv.bottles?.find((b: any) => b.type === bottleType);
      return sum + (bottle?.quantity || 0);
    }, 0);
  };

  const calculateTotal = (field: string): number => {
    return inventories.reduce((sum, inv) => sum + (inv[field] || 0), 0);
  };

  // Helper function to convert minutes to hours with H separator
  const convertMinutesToHours = (minutes: number): string => {
    const totalHours = minutes / 60;
    const hours = Math.floor(totalHours);
    const mins = Math.round((totalHours - hours) * 60);
    return `${hours}H${mins.toString().padStart(2, '0')}`;
  };

  // Calculate Rendement Horaire for a single inventory (in T/hour)
  const calculateRendementHoraire = (inventory: any): string => {
    if (!inventory.tempsUtile || inventory.tempsUtile === 0) return '-';

    const totalBottlesTonnage = inventory.bottles?.reduce((sum: number, bottle: any) => {
      return sum + (bottle.tonnage || 0);
    }, 0) || 0;

    const hoursWorked = inventory.tempsUtile / 60;
    return (totalBottlesTonnage / hoursWorked).toFixed(2);
  };

  // Calculate percentage of RH over hourly capacity
  const calculatePercentageCapacity = (inventory: any): string => {
    if (!inventory.tempsUtile || inventory.tempsUtile === 0) return '-';

    const totalBottlesTonnage = inventory.bottles?.reduce((sum: number, bottle: any) => {
      return sum + (bottle.tonnage || 0);
    }, 0) || 0;

    const hoursWorked = inventory.tempsUtile / 60;
    const rendementHoraire = totalBottlesTonnage / hoursWorked;
    const percentage = (rendementHoraire / hourlyCapacity) * 100;
    return percentage.toFixed(2);
  };

  // Calculate average Creux
  const calculateAverageCreux = (): string => {
    const totalCreux = inventories.reduce((sum, inv) => {
      const creux = totalCapacityTonnes - (inv.stockFinalPhysique || 0);
      return sum + creux;
    }, 0);
    return inventories.length > 0 ? (totalCreux / inventories.length).toFixed(3) : '0.000';
  };

  // Dynamic column styles
  const colStyle = {
    borderRightWidth: 0.5,
    borderRightColor: '#e0e0e0',
    padding: 1,
    fontSize: 5,
  };

  const sectionStyle = (width: number) => ({
    width: `${width}%`,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    flexDirection: 'row' as const,
  });

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
            {/* DATE */}
            <View style={{ width: '3.5%', backgroundColor: 'transparent' }}>
              <Text style={styles.headerCell}>DATE</Text>
            </View>

            {/* STOCK INIT */}
            <View style={{ width: '5%', backgroundColor: 'transparent' }}>
              <Text style={styles.headerCell}>STOCK INIT</Text>
            </View>

            {/* APPROVISIONNEMENTS - only if fields exist */}
            {showApproSection && (
              <View style={sectionStyle(widths.approWidth)}>
                <Text style={styles.headerCell}>APPROVISIONNEMENTS</Text>
              </View>
            )}

            {/* SORTIES VRAC - only if fields exist */}
            {showSortieSection && (
              <View style={sectionStyle(widths.sortieWidth)}>
                <Text style={styles.headerCell}>SORTIES VRAC</Text>
              </View>
            )}

            {/* SORTIES CONDITIONNÉES */}
            <View style={sectionStyle(widths.bottleWidth)}>
              <Text style={styles.headerCell}>SORTIES CONDITIONNÉES</Text>
            </View>

            {/* STOCK FINAL */}
            <View style={{ width: `${12 + widths.reservoirWidth}%`, borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' }}>
              <Text style={styles.headerCell}>STOCK FINAL</Text>
            </View>

            {/* RENDEMENT */}
            <View style={{ width: '14%', flexDirection: 'row' }}>
              <Text style={styles.headerCell}>RENDEMENT</Text>
            </View>
          </View>

          {/* Column Headers (Row 2) */}
          <View style={styles.tableHeaderRow}>
            {/* Date */}
            <View style={{ width: '3.5%', ...colStyle }}>
              <Text style={styles.headerCellSub}>Date</Text>
            </View>

            {/* Stock Initial */}
            <View style={{ width: '5%', ...colStyle }}>
              <Text style={styles.headerCellSub}>VRAC (T)</Text>
            </View>

            {/* Appro section - dynamic columns */}
            {showApproSection && (
              <View style={sectionStyle(widths.approWidth)}>
                {approFields.map((field, idx) => (
                  <View key={idx} style={{ flex: 1, ...colStyle }}>
                    <Text style={styles.headerCellSub}>{field.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sorties VRAC section - dynamic columns */}
            {showSortieSection && (
              <View style={sectionStyle(widths.sortieWidth)}>
                {sortieFields.map((field, idx) => (
                  <View key={idx} style={{ flex: 1, ...colStyle }}>
                    <Text style={styles.headerCellSub}>{field.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sorties Conditionnées section */}
            <View style={sectionStyle(widths.bottleWidth)}>
              {bottleTypes.map((type, idx) => (
                <View key={idx} style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.headerCellSub}>{String(type).replace('_', '.')}</Text>
                </View>
              ))}
              <View style={{ flex: 1.2, ...colStyle }}>
                <Text style={[styles.headerCellSub, { fontFamily: 'Oswald' }]}>Cumul (T)</Text>
              </View>
            </View>

            {/* Stock Final section */}
            <View style={{ width: `${12 + widths.reservoirWidth}%`, borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' }}>
              <View style={{ flex: 1.2, ...colStyle }}>
                <Text style={styles.headerCellSub}>ST (T)</Text>
              </View>

              {/* Reservoir columns - dynamic */}
              {reservoirs.map((res, idx) => (
                <View key={idx} style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.headerCellSub}>{res.name}</Text>
                </View>
              ))}

              <View style={{ flex: 1.2, ...colStyle }}>
                <Text style={styles.headerCellSub}>SFP (T)</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={styles.headerCellSub}>Écart</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={styles.headerCellSub}>Creux</Text>
              </View>
            </View>

            {/* Rendement section */}
            <View style={{ width: '14%', flexDirection: 'row' }}>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={styles.headerCellSub}>THT (h)</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={styles.headerCellSub}>TA (min)</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={styles.headerCellSub}>TU (h)</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={styles.headerCellSub}>RH (T/h)</Text>
              </View>
              <View style={{ flex: 1, padding: 1, fontSize: 5 }}>
                <Text style={styles.headerCellSub}>% {hourlyCapacity}T</Text>
              </View>
            </View>
          </View>

          {/* Data Rows */}
          {inventories.map((inventory, idx) => (
            <View key={idx} style={styles.tableRow}>
              {/* Date */}
              <View style={{ width: '3.5%', ...colStyle }}>
                <Text style={styles.cellTextDate}>
                  {new Date(inventory.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </Text>
              </View>

              {/* Stock Initial */}
              <View style={{ width: '5%', ...colStyle }}>
                <Text style={styles.cellText}>{inventory.stockInitialPhysique?.toFixed(3) || '0.000'}</Text>
              </View>

              {/* Approvisionnement section - dynamic */}
              {showApproSection && (
                <View style={sectionStyle(widths.approWidth)}>
                  {approFields.map((field, fIdx) => (
                    <View key={fIdx} style={{ flex: 1, ...colStyle }}>
                      <Text style={styles.cellText}>{getApproValue(inventory, field.name).toFixed(3)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sorties VRAC section - dynamic */}
              {showSortieSection && (
                <View style={sectionStyle(widths.sortieWidth)}>
                  {sortieFields.map((field, fIdx) => (
                    <View key={fIdx} style={{ flex: 1, ...colStyle }}>
                      <Text style={styles.cellText}>{getSortieValue(inventory, field.name).toFixed(3)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Sorties Conditionnées section */}
              <View style={sectionStyle(widths.bottleWidth)}>
                {bottleTypes.map((type, typeIdx) => {
                  const bottle = inventory.bottles?.find((b: any) => b.type === type);
                  return (
                    <View key={typeIdx} style={{ flex: 1, ...colStyle }}>
                      <Text style={styles.cellText}>{bottle?.quantity || '0'}</Text>
                    </View>
                  );
                })}
                <View style={{ flex: 1.2, ...colStyle }}>
                  <Text style={[styles.cellText, { fontFamily: 'Oswald' }]}>
                    {(inventory.cumulSortie || 0).toFixed(3)}
                  </Text>
                </View>
              </View>

              {/* Stock Final section */}
              <View style={{ width: `${12 + widths.reservoirWidth}%`, borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' }}>
                {/* Stock Théorique */}
                <View style={{ flex: 1.2, ...colStyle }}>
                  <Text style={styles.cellText}>{(inventory.stockFinalTheorique || 0).toFixed(3)}</Text>
                </View>

                {/* Reservoirs - dynamic */}
                {reservoirs.map((res, resIdx) => (
                  <View key={resIdx} style={{ flex: 1, ...colStyle }}>
                    <Text style={styles.cellText}>
                      {getReservoirWeight(inventory, res.name).toFixed(3)}
                    </Text>
                  </View>
                ))}

                {/* Stock Final Physique */}
                <View style={{ flex: 1.2, ...colStyle }}>
                  <Text style={styles.cellText}>{(inventory.stockFinalPhysique || 0).toFixed(3)}</Text>
                </View>

                {/* Écart */}
                <View style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.cellText}>
                    {(inventory.ecart || 0).toFixed(3)}
                  </Text>
                </View>

                {/* Creux */}
                <View style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.cellText}>
                    {(totalCapacityTonnes - (inventory.stockFinalPhysique || 0)).toFixed(3)}
                  </Text>
                </View>
              </View>

              {/* Rendement section */}
              <View style={{ width: '14%', flexDirection: 'row' }}>
                <View style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.cellText}>{convertMinutesToHours(inventory.tempsTotal || 0)}</Text>
                </View>
                <View style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.cellText}>{inventory.tempsArret || '0'}</Text>
                </View>
                <View style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.cellText}>{convertMinutesToHours(inventory.tempsUtile || 0)}</Text>
                </View>
                <View style={{ flex: 1, ...colStyle }}>
                  <Text style={styles.cellText}>
                    {calculateRendementHoraire(inventory)}
                  </Text>
                </View>
                <View style={{ flex: 1, padding: 1, fontSize: 5 }}>
                  <Text style={styles.cellText}>
                    {calculatePercentageCapacity(inventory)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.tableTotalRow}>
            <View style={{ width: '3.5%', ...colStyle }}>
              <Text style={[styles.cellText, { fontFamily: 'Oswald', fontSize: 6, textAlign: 'center' }]}>TOTAL</Text>
            </View>
            <View style={{ width: '5%', ...colStyle }}>
              <Text style={[styles.cellText, { textAlign: 'center' }]}>-</Text>
            </View>

            {/* Appro Totals - dynamic */}
            {showApproSection && (
              <View style={sectionStyle(widths.approWidth)}>
                {approFields.map((field, fIdx) => (
                  <View key={fIdx} style={{ flex: 1, ...colStyle }}>
                    <Text style={[styles.cellText, { fontSize: 6 }]}>
                      {calculateApproTotal(field.name).toFixed(3)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sorties VRAC Totals - dynamic */}
            {showSortieSection && (
              <View style={sectionStyle(widths.sortieWidth)}>
                {sortieFields.map((field, fIdx) => (
                  <View key={fIdx} style={{ flex: 1, ...colStyle }}>
                    <Text style={[styles.cellText, { fontSize: 6 }]}>
                      {calculateSortieTotal(field.name).toFixed(3)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sorties Conditionnées Totals */}
            <View style={sectionStyle(widths.bottleWidth)}>
              {bottleTypes.map((type, typeIdx) => (
                <View key={typeIdx} style={{ flex: 1, ...colStyle }}>
                  <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateBottleTotal(type).toFixed(0)}</Text>
                </View>
              ))}
              <View style={{ flex: 1.2, ...colStyle }}>
                <Text style={[styles.cellText, { fontFamily: 'Oswald', fontSize: 6 }]}>
                  {calculateTotal('cumulSortie').toFixed(3)}
                </Text>
              </View>
            </View>

            {/* Stock Final Totals */}
            <View style={{ width: `${12 + widths.reservoirWidth}%`, borderRightWidth: 1, borderRightColor: '#ddd', flexDirection: 'row' }}>
              <View style={{ flex: 1.2, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6, textAlign: 'center' }]}>-</Text>
              </View>

              {reservoirs.map((res, resIdx) => (
                <View key={resIdx} style={{ flex: 1, ...colStyle }}>
                  <Text style={[styles.cellText, { fontSize: 5, textAlign: 'center' }]}>-</Text>
                </View>
              ))}

              <View style={{ flex: 1.2, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6, textAlign: 'center' }]}>-</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('ecart').toFixed(3)}</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateAverageCreux()}</Text>
              </View>
            </View>

            {/* Rendement Totals */}
            <View style={{ width: '14%', flexDirection: 'row' }}>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {convertMinutesToHours(calculateTotal('tempsTotal'))}
                </Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>{calculateTotal('tempsArret').toFixed(0)}</Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {convertMinutesToHours(calculateTotal('tempsUtile'))}
                </Text>
              </View>
              <View style={{ flex: 1, ...colStyle }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {(() => {
                    const totalTempsUtile = calculateTotal('tempsUtile');
                    if (!totalTempsUtile || totalTempsUtile === 0) return '-';

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
              <View style={{ flex: 1, padding: 1, fontSize: 5 }}>
                <Text style={[styles.cellText, { fontSize: 6 }]}>
                  {(() => {
                    const totalTempsUtile = calculateTotal('tempsUtile');
                    if (!totalTempsUtile || totalTempsUtile === 0) return '-';

                    const totalBottlesTonnage = inventories.reduce((sum, inv) => {
                      const invBottlesTonnage = inv.bottles?.reduce((bottleSum: number, bottle: any) => {
                        return bottleSum + (bottle.tonnage || 0);
                      }, 0) || 0;
                      return sum + invBottlesTonnage;
                    }, 0);

                    const totalHoursWorked = totalTempsUtile / 60;
                    const rendementHoraire = totalBottlesTonnage / totalHoursWorked;
                    const percentage = (rendementHoraire / hourlyCapacity) * 100;
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

export default DynamicMonthlyProductionPDF;
