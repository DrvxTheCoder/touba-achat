import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, DocumentProps } from '@react-pdf/renderer';
import { BOTTLE_TYPES } from '@/lib/types/production';

const pageURL = "https://touba-app.com";

// Register fonts
Font.register({
  family: 'Ubuntu',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf',
      fontWeight: 'bold',
    }
  ],
});

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

// Define styles
const styles = StyleSheet.create({
  boldText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'Oswald' },
  page: {
    padding: 25,
    paddingBottom: 15,
    position: 'relative',
    fontFamily: 'Ubuntu',
    fontSize: 9,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent:'flex-end',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  logo: { width: 45},
  header: {
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    fontFamily: 'Oswald',
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 1,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 6,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
    backgroundColor: '#e8f5e9',
    padding: 4,
    fontFamily: 'Oswald',
    borderRadius: 2,
  },
  table: {
    marginTop: 3,
    marginBottom: 3,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 4,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
  },
  summaryBox: {
    backgroundColor: '#f9f9f9',
    padding: 6,
    marginTop: 2,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingHorizontal: 3,
  },
  summaryLabel: {
    fontWeight: 'bold',
    fontSize: 9,
  },
  summaryValue: {
    textAlign: 'right',
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#c8e6c9',
    padding: 4,
    fontWeight: 'bold',
    borderTopWidth: 2,
    borderTopColor: '#4caf50',
  },
  highlightBox: {
    backgroundColor: '#fff3cd',
    padding: 6,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#000',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
  },
});

interface ProductionInventoryPDFProps {
  inventory: any;
  previousInventory?: any;
  qrCodeImage?: string;
}

const ProductionInventoryPDF = ({ inventory, previousInventory, qrCodeImage }: ProductionInventoryPDFProps): React.ReactElement<DocumentProps> => {
  const date = new Date(inventory.date).toLocaleDateString('fr-FR');
  const previousDate = previousInventory ? new Date(previousInventory.date).toLocaleDateString('fr-FR') : null;

  // Helper function to format time in hours and minutes if > 60 min
  const formatTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
    return `${minutes} min`;
  };

  // Calculate total appro
  const totalAppro = (inventory.butanier || 0) + (inventory.recuperation || 0) + (inventory.approSAR || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top section with logo */}
        <View style={styles.topSection}>
          <View>
            <Image style={styles.logo} src="https://touba-app.com/assets/img/touba-app192x192.png" />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FICHE D&apos;INVENTAIRE PRODUCTION (JOURNALIER)</Text>
          <Text style={styles.subtitle}>
            Date: {new Date(inventory.date).toLocaleDateString('fr-FR')}
            {' - '}
            {inventory.productionCenter?.name || 'Centre de production'}
            {/* {' - '}
            Démarré par: {inventory.startedBy?.name || 'N/A'} */}
          </Text>
        </View>

        {/* Previous Day's Stock */}
        {previousInventory && previousInventory.reservoirs && previousInventory.reservoirs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STOCK DÉPART</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Nom</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Hauteur (mm)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids liq. (T)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids gaz (T)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids tot. (T)</Text>
              </View>
              {previousInventory.reservoirs.map((reservoir: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.name}</Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.hauteur}</Text>
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>
                    {reservoir.poidsLiquide?.toFixed(3) || '0'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>
                    {reservoir.poidsGaz?.toFixed(3) || '0'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.8 }]}>
                    {reservoir.poidsTotal?.toFixed(3) || '0'}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.tableCell, { flex: 0.6, fontFamily: 'Oswald' }]}>TOTAL</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontFamily: 'Oswald' }]}>
                  {previousInventory.reservoirs
                    .reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0)
                    .toFixed(3)}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}></Text>
              </View>
            </View>
          </View>
        )}

        {/* Merged Approvisionnements & Sorties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPROVISIONNEMENTS & SORTIES</Text>
          <View style={styles.summaryBox}>
            {/* Approvisionnements */}
            <Text style={[styles.summaryLabel, { marginBottom: 3, fontSize: 8, color: '#2e7d32' }]}>
              Approvisionnements:
            </Text>
            <View style={[styles.summaryRow, { paddingLeft: 8 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Butanier:</Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.butanier || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={[styles.summaryRow, { paddingLeft: 8 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Récupération:</Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.recuperation || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={[styles.summaryRow, { paddingLeft: 8 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Appro SAR:</Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.approSAR || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={[styles.summaryRow, { paddingLeft: 8, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 2, marginTop: 2 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 9, fontFamily: 'Oswald' }]}>
                TOTAL APPROVISIONNEMENTS :
              </Text>
              <Text style={[styles.summaryValue, { fontSize: 9, fontFamily: 'Oswald' }]}>
                {totalAppro.toFixed(3)} T
              </Text>
            </View>

            <View style={{ height: 6 }} />

            {/* Sorties - Remplissage bouteilles */}
            <Text style={[styles.summaryLabel, { marginBottom: 3, fontSize: 8, color: '#d32f2f' }]}>
              Sorties:
            </Text>
            {Object.keys(BOTTLE_TYPES).map((bottleType: string) => {
              const bottle = inventory.bottles?.find((b: any) => b.type === bottleType);
              const quantity = bottle?.quantity || 0;
              const tonnage = bottle?.tonnage || 0;

              return (
                <View key={bottleType} style={[styles.summaryRow, { paddingLeft: 8 }]}>
                  <Text style={[styles.summaryLabel, { fontSize: 8 }]}>
                    {BOTTLE_TYPES[bottleType as keyof typeof BOTTLE_TYPES]} ({quantity} unités):
                  </Text>
                  <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                    {tonnage.toFixed(3)} T
                  </Text>
                </View>
              );
            })}
            <View style={[styles.summaryRow, { paddingLeft: 8, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 2, marginTop: 2 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>
                Sous-total Remplissage:
              </Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.bottles?.reduce((sum: number, b: any) => sum + b.tonnage, 0) || 0).toFixed(3)} T
              </Text>
            </View>

            <View style={{ height: 4 }} />

            {/* Autres sorties */}
            <View style={[styles.summaryRow, { paddingLeft: 8 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Ngabou:</Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.ngabou || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={[styles.summaryRow, { paddingLeft: 8 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Exports:</Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.exports || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={[styles.summaryRow, { paddingLeft: 8 }]}>
              <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Divers:</Text>
              <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                {(inventory.divers || 0).toFixed(3)} T
              </Text>
            </View>

            {/* Cumul total */}
            <View style={[styles.summaryRow, { borderTopWidth: 2, borderTopColor: '#4caf50', paddingTop: 3, marginTop: 3 }]}>
              <Text style={[styles.summaryLabel, { fontFamily: 'Oswald', fontSize: 9 }]}>
                CUMUL SORTIE:
              </Text>
              <Text style={[styles.summaryValue, { fontFamily: 'Oswald', fontSize: 9 }]}>
                {(inventory.cumulSortie || 0).toFixed(3)} T
              </Text>
            </View>
          </View>
        </View>

        {/* Stock Final Physique Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STOCK FINAL PHYSIQUE (RÉSERVOIRS)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { flex: 0.6 }]}>Nom</Text>
              <Text style={[styles.tableCell, { flex: 0.6 }]}>Hauteur (mm)</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids liq. (T)</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids gaz (T)</Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids tot. (T)</Text>
            </View>
            {inventory.reservoirs.map((reservoir: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.name}</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.hauteur}</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>
                  {reservoir.poidsLiquide?.toFixed(3) || '0'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>
                  {reservoir.poidsGaz?.toFixed(3) || '0'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>
                  {reservoir.poidsTotal?.toFixed(3) || '0'}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.tableCell, { flex: 0.6, fontFamily: 'Oswald' }]}>TOTAL</Text>
              <Text style={[styles.tableCell, { flex: 0.6 }]}></Text>
              <Text style={[styles.tableCell, { flex: 0.8, fontFamily: 'Oswald' }]}>
                {inventory.reservoirs
                  .reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0)
                  .toFixed(3)}
              </Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}></Text>
              <Text style={[styles.tableCell, { flex: 0.8 }]}></Text>
            </View>
          </View>
        </View>

        {/* Two column layout for Stock Final and Stock Final Physique */}
        <View style={styles.twoColumns}>
          {/* Temps de production */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>⏱️ TEMPS DE PRODUCTION</Text>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Temps total:</Text>
                <Text style={[styles.summaryValue, { fontSize: 8 }]}>{formatTime(inventory.tempsTotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Temps d&apos;arrêt:</Text>
                <Text style={[styles.summaryValue, { fontSize: 8 }]}>{formatTime(inventory.tempsArret)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Temps utile:</Text>
                <Text style={[styles.summaryValue, { fontSize: 8 }]}>{formatTime(inventory.tempsUtile)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Rendement:</Text>
                <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                  {inventory.rendement?.toFixed(2) || '0'}%
                </Text>
              </View>
            </View>
          </View>
          {/* Stock Final */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>STOCK FINAL</Text>
            <View style={styles.highlightBox}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Stock Théorique:</Text>
                <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                  {inventory.stockFinalTheorique?.toFixed(3) || '0.000'} T
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontSize: 8 }]}>Stock Physique:</Text>
                <Text style={[styles.summaryValue, { fontSize: 8 }]}>
                  {inventory.reservoirs.reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0).toFixed(3)} T
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#d32f2f', fontSize: 8 }]}>Écart:</Text>
                <Text style={[styles.summaryValue, { color: '#d32f2f', fontSize: 8 }]}>
                  {inventory.ecart?.toFixed(3) || '0.000'} T ({inventory.ecartPourcentage?.toFixed(2) || '0.00'}%)
                </Text>
              </View>
            </View>
          </View>


        </View>

        {/* Observations */}
        {inventory.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 OBSERVATIONS</Text>
            <View style={{ backgroundColor: '#f9f9f9', padding: 5, borderRadius: 3 }}>
              <Text style={{ fontSize: 8, lineHeight: 1.4 }}>
                {inventory.observations}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          Document généré le {new Date().toLocaleString('fr-FR')} - Touba App
        </Text>
      </Page>
    </Document>
  );
};

export default ProductionInventoryPDF;
