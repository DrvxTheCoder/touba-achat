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
    padding: 30,
    position: 'relative',
    fontFamily: 'Ubuntu',
    fontSize: 10,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent:'flex-end',
    alignItems: 'flex-start',
    margin: 10,
    marginBottom: 15
  },
  logo: { width: 50},
  logoTag: { 
    marginTop: 2,
    width: '55%',
    fontSize: 10,
    textAlign: 'left',
  },
  qrCode: { width: 80, height: 80 },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '45%',
    transform: 'translate(-50%, -50%)',
    opacity: 0.1,
    width: 200
  },
  header: {
    marginBottom: 2,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Oswald',
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 2,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 2,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    backgroundColor: '#e8f5e9',
    padding: 6,
    fontFamily: 'Oswald',
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 5,
  },
  label: {
    width: '45%',
    fontWeight: 'bold',
    fontSize: 10,
  },
  value: {
    width: '55%',
    fontSize: 10,
  },
  table: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 5,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellSmall: {
    flex: 0.7,
    fontSize: 9,
  },
  tableCellLarge: {
    flex: 1.3,
    fontSize: 9,
  },
  summaryBox: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingHorizontal: 5,
  },
  summaryLabel: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  summaryValue: {
    textAlign: 'right',
    fontSize: 10,
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#c8e6c9',
    padding: 6,
    fontWeight: 'bold',
    borderTopWidth: 2,
    borderTopColor: '#4caf50',
  },
  highlightBox: {
    backgroundColor: '#fff3cd',
    padding: 8,
    marginVertical: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#000',
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


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top section with logo and QR */}
        <View style={styles.topSection}>
          <View>
            <Image style={styles.logo} src="https://touba-app.com/assets/img/touba-app192x192.png" />
            {/* <Text style={[styles.logoTag, { fontSize: 8 }]}>Généré par ToubaApp™</Text> */}
          </View>
          {/* {qrCodeImage && <Image style={styles.qrCode} src={qrCodeImage} />} */}
        </View>

        {/* Watermark */}
        {/* <Image style={styles.watermark} src="https://touba-app.com/assets/img/touba-app512x512-1.png" /> */}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FICHE D&apos;INVENTAIRE PRODUCTION (JOURNALIER)</Text>
          <Text style={styles.subtitle}>
            {inventory.productionCenter?.name || 'Centre de production'}
            {', '}
            Date: {new Date(inventory.startedAt).toLocaleString('fr-FR')}
            {', '}
            Démarré par: {inventory.startedBy?.name || 'N/A'}
          </Text>
          <Text style={styles.subtitle}></Text>
          {/* <Text style={[styles.subtitle, { fontSize: 10, marginTop: 5 }]}>
            Statut: {inventory.status === 'TERMINE' ? 'Terminé ✓' : 'En cours'}
          </Text> */}
        </View>

        {/* Informations générales */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 INFORMATIONS GÉNÉRALES</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Démarré par:</Text>
            <Text style={styles.value}>{inventory.startedBy?.name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de début:</Text>
            <Text style={styles.value}>
              {new Date(inventory.startedAt).toLocaleString('fr-FR')}
            </Text>
          </View>
          {inventory.completedBy && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Clôturé par:</Text>
                <Text style={styles.value}>{inventory.completedBy.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date de clôture:</Text>
                <Text style={styles.value}>
                  {new Date(inventory.completedAt).toLocaleString('fr-FR')}
                </Text>
              </View>
            </>
          )}
        </View> */}

        {/* Temps de production */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ TEMPS DE PRODUCTION</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Temps total:</Text>
              <Text style={styles.summaryValue}>{inventory.tempsTotal} min</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Temps d&apos;arrêt:</Text>
              <Text style={styles.summaryValue}>{inventory.tempsArret} min</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Temps utile:</Text>
              <Text style={styles.summaryValue}>{inventory.tempsUtile} min</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rendement:</Text>
              <Text style={styles.summaryValue}>
                {inventory.rendement?.toFixed(2) || '0'}%
              </Text>
            </View>
          </View>
        </View>

        {/* Stocks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 STOCKS ET APPROVISIONNEMENTS</Text>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stock Initial Physique:</Text>
              <Text style={styles.summaryValue}>
                {inventory.stockInitialPhysique?.toFixed(3)} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Butanier:</Text>
              <Text style={styles.summaryValue}>
                {(inventory.butanier || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Récupération:</Text>
              <Text style={styles.summaryValue}>
                {(inventory.recuperation || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Appro SAR:</Text>
              <Text style={styles.summaryValue}>
                {(inventory.approSAR || 0).toFixed(3)} T
              </Text>
            </View>
          </View>
        </View>

        {/* Sorties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📤 SORTIES</Text>
          <View style={styles.summaryBox}>
            {/* Remplissage bouteilles */}
            <>
              <Text style={[styles.summaryLabel, { marginBottom: 5, fontSize: 9, color: '#666' }]}>
                Remplissage Bouteilles:
              </Text>
              {Object.keys(BOTTLE_TYPES).map((bottleType: string) => {
                const bottle = inventory.bottles?.find((b: any) => b.type === bottleType);
                const quantity = bottle?.quantity || 0;
                const tonnage = bottle?.tonnage || 0;

                return (
                  <View key={bottleType} style={[styles.summaryRow, { paddingLeft: 10 }]}>
                    <Text style={[styles.summaryLabel, { fontSize: 9 }]}>
                      {BOTTLE_TYPES[bottleType as keyof typeof BOTTLE_TYPES]} ({quantity} unités):
                    </Text>
                    <Text style={[styles.summaryValue, { fontSize: 9 }]}>
                      {tonnage.toFixed(3)} T
                    </Text>
                  </View>
                );
              })}
              <View style={[styles.summaryRow, { paddingLeft: 10, borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 3, marginTop: 3 }]}>
                <Text style={[styles.summaryLabel, { fontSize: 9, fontFamily: 'Oswald' }]}>
                  Sous-total Remplissage:
                </Text>
                <Text style={[styles.summaryValue, { fontSize: 9, fontFamily: 'Oswald' }]}>
                  {(inventory.bottles?.reduce((sum: number, b: any) => sum + b.tonnage, 0) || 0).toFixed(3)} T
                </Text>
              </View>
              <View style={{ height: 8 }} />
            </>

            {/* Autres sorties */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ngabou:</Text>
              <Text style={styles.summaryValue}>
                {(inventory.ngabou || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Exports:</Text>
              <Text style={styles.summaryValue}>
                {(inventory.exports || 0).toFixed(3)} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Divers:</Text>
              <Text style={styles.summaryValue}>
                {(inventory.divers || 0).toFixed(3)} T
              </Text>
            </View>

            {/* Cumul total */}
            <View style={[styles.summaryRow, { borderTopWidth: 2, borderTopColor: '#4caf50', paddingTop: 5, marginTop: 5 }]}>
              <Text style={[styles.summaryLabel, { fontFamily: 'Oswald', fontSize: 11 }]}>
                CUMUL SORTIE (TOTAL):
              </Text>
              <Text style={[styles.summaryValue, { fontFamily: 'Oswald', fontSize: 11 }]}>
                {(inventory.cumulSortie || 0).toFixed(3)} T
              </Text>
            </View>
          </View>
        </View>

        {/* Stock final - highlighted */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STOCK FINAL</Text>
          <View style={styles.highlightBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stock Final Théorique:</Text>
              <Text style={styles.summaryValue}>
                {inventory.stockFinalTheorique?.toFixed(3) || '0.000'} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Stock Final Physique:</Text>
              <Text style={styles.summaryValue}>
                {inventory.reservoirs.reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0).toFixed(3)} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#d32f2f' }]}>Écart:</Text>
              <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>
                {inventory.ecart?.toFixed(3) || '0.000'} T
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#d32f2f' }]}>Écart (%):</Text>
              <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>
                {inventory.ecartPourcentage?.toFixed(2) || '0.00'}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Document généré le {new Date().toLocaleString('fr-FR')} - Page 1/2
        </Text>
      </Page>

      {/* Page 2: Production */}
      <Page size="A4" style={styles.page}>
        {/* <Image style={styles.watermark} src="https://touba-app.com/assets/img/touba-app512x512-1.png" /> */}

        {/* Production de bouteilles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍾 PRODUCTION DE BOUTEILLES</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCell}>Type</Text>
              <Text style={styles.tableCell}>Quantité</Text>
              <Text style={styles.tableCell}>Tonnage (T)</Text>
            </View>
            {Object.keys(BOTTLE_TYPES).map((bottleType: string) => {
              const bottle = inventory.bottles?.find((b: any) => b.type === bottleType);
              const quantity = bottle?.quantity || 0;
              const tonnage = bottle?.tonnage || 0;

              return (
                <View key={bottleType} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{BOTTLE_TYPES[bottleType as keyof typeof BOTTLE_TYPES]}</Text>
                  <Text style={styles.tableCell}>{quantity}</Text>
                  <Text style={styles.tableCell}>{tonnage.toFixed(3)}</Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={[styles.tableCell, { fontFamily: 'Oswald' }]}>TOTAL</Text>
              <Text style={[styles.tableCell, { fontFamily: 'Oswald' }]}>
                {inventory.bottles?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0}
              </Text>
              <Text style={[styles.tableCell, { fontFamily: 'Oswald' }]}>
                {(inventory.bottles?.reduce((sum: number, b: any) => sum + b.tonnage, 0) || 0).toFixed(3)}
              </Text>
            </View>
          </View>
        </View>

        {/* Arrêts techniques */}
        {inventory.arrets && inventory.arrets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ ARRÊTS TECHNIQUES</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellLarge}>Type</Text>
                <Text style={styles.tableCell}>Durée (min)</Text>
                <Text style={styles.tableCell}>Ajouté le</Text>
                <Text style={styles.tableCellSmall}>Remarque</Text>
              </View>
              {inventory.arrets.map((arret: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCellLarge}>{arret.type}</Text>
                  <Text style={styles.tableCell}>{arret.duree}</Text>
                  <Text style={styles.tableCell}>
                    {new Date(arret.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.tableCellSmall}>{arret.remarque || '-'}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.tableCellLarge, { fontFamily: 'Oswald' }]}>
                  TOTAL DURÉE
                </Text>
                <Text style={[styles.tableCell, { fontFamily: 'Oswald' }]}>
                  {inventory.arrets.reduce((sum: number, a: any) => sum + a.duree, 0)} min
                </Text>
                <Text style={styles.tableCell}></Text>
                <Text style={styles.tableCellSmall}></Text>
              </View>
            </View>
          </View>
        )}

        {/* Observations */}
        {inventory.observations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVATIONS</Text>
            <View style={{ backgroundColor: '#f9f9f9', padding: 8, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
                {inventory.observations}
              </Text>
            </View>
          </View>
        )}

                {/* Previous Day's Stock Final Physique */}
        {previousInventory && previousInventory.reservoirs && previousInventory.reservoirs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              STOCK DEPART
            </Text>
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
                <Text style={[styles.tableCell, { flex: 0.6, fontFamily: 'Oswald' }]}>
                  TOTAL
                </Text>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STOCK FINAL PHYSIQUE</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Nom</Text>
                {/* <Text style={[styles.tableCell, { flex: 0.5 }]}>Type</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Cap. (m³)</Text> */}
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Hauteur (mm)</Text>
                {/* <Text style={[styles.tableCell, { flex: 0.6 }]}>Temp. (°C)</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>Vol. liq. (m³)</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Press. (bar)</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>Dens. 15°C</Text> */}
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids liq. (T)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids gaz (T)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids tot. (T)</Text>
              </View>
              {inventory.reservoirs.map((reservoir: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.name}</Text>
                  {/* <Text style={[styles.tableCell, { flex: 0.5 }]}>
                    {reservoir.reservoirConfig?.type || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>
                    {reservoir.reservoirConfig?.capacity?.toFixed(2) || '0'}
                  </Text> */}
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.hauteur}</Text>
                  {/* <Text style={[styles.tableCell, { flex: 0.6 }]}>
                    {reservoir.temperature}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.7 }]}>
                    {reservoir.volumeLiquide.toFixed(3)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>
                    {reservoir.pressionInterne}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.7 }]}>
                    {reservoir.densiteA15C.toFixed(3)}
                  </Text> */}
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
                <Text style={[styles.tableCell, { flex: 0.6, fontFamily: 'Oswald' }]}>
                  TOTAL
                </Text>
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



        <Text style={styles.footer}>
          Document généré le {new Date().toLocaleString('fr-FR')} - Page 2/2
        </Text>
      </Page>

      {/* Page 3: Réservoirs */}
      {/* {inventory.reservoirs && inventory.reservoirs.length > 0 && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Image style={styles.watermark} src="https://touba-app.com/assets/img/touba-app512x512-1.png" />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>STOCK FINAL PHYSIQUE</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Nom</Text>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>Type</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Cap. (m³)</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Hauteur (mm)</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Temp. (°C)</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>Vol. liq. (m³)</Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}>Press. (bar)</Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}>Dens. 15°C</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids liq. (T)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids gaz (T)</Text>
                <Text style={[styles.tableCell, { flex: 0.8 }]}>Poids tot. (T)</Text>
              </View>
              {inventory.reservoirs.map((reservoir: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.name}</Text>
                  <Text style={[styles.tableCell, { flex: 0.5 }]}>
                    {reservoir.reservoirConfig?.type || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>
                    {reservoir.reservoirConfig?.capacity?.toFixed(2) || '0'}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>{reservoir.hauteur}</Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>
                    {reservoir.temperature}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.7 }]}>
                    {reservoir.volumeLiquide.toFixed(3)}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.6 }]}>
                    {reservoir.pressionInterne}
                  </Text>
                  <Text style={[styles.tableCell, { flex: 0.7 }]}>
                    {reservoir.densiteA15C.toFixed(3)}
                  </Text>
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
                <Text style={[styles.tableCell, { flex: 0.6, fontFamily: 'Oswald' }]}>
                  TOTAL
                </Text>
                <Text style={[styles.tableCell, { flex: 0.5 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.6 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.7 }]}></Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontFamily: 'Oswald' }]}>
                  {inventory.reservoirs
                    .reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0)
                    .toFixed(3)}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontFamily: 'Oswald' }]}>
                  {inventory.reservoirs
                    .reduce((sum: number, r: any) => sum + (r.poidsGaz || 0), 0)
                    .toFixed(3)}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontFamily: 'Oswald' }]}>
                  {inventory.reservoirs
                    .reduce((sum: number, r: any) => sum + (r.poidsLiquide || 0), 0)
                    .toFixed(3)}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.footer}>
            Document généré le {new Date().toLocaleString('fr-FR')} - Page 3/3
          </Text>
        </Page>
      )} */}
    </Document>
  );
};

export default ProductionInventoryPDF;
