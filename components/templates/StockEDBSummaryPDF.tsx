import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { StockEDB } from '@/app/dashboard/etats/stock/types/stock-edb';

const pageURL = "https://touba-app.com";

Font.register({
  family: 'Ubuntu',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf',
      fontWeight: 'bold',
    }
  ],
});

type StockEDBSummaryPDFProps = {
  stockEdb: StockEDB;
};

const styles = StyleSheet.create({
  page: { padding: 30, position: 'relative', fontFamily: 'Ubuntu' },
  section: { margin: 10, padding: 10 },
  sectionTwo: { margin: 5, padding: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 15 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  amount: { fontSize: 16 , marginTop: 10, textAlign: 'right', fontWeight: 'bold' },
  text: { fontSize: 12, marginBottom: 10 },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', margin: 10, marginBottom: 20 },
  logo: { width: 50 },
  qrCode: { width: 80, height: 80 },
  watermark: { position: 'absolute', top: '50%', left: '45%', transform: 'translate(-50%, -50%)', opacity: 0.1, width: 200 },
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 },
  timeline: { marginTop: 20 },
  stamp: { position: 'absolute', bottom: 50, right: 50, width: 100, height: 100 },
});

const getStatusLabel = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    SUBMITTED: 'Soumis',
    DELIVERED: 'Livré',
    CONVERTED: 'Converti en EDB',
    PARTIALLY_DELIVERED: 'Livré (reste manquant)',
    ORDERED: 'Commandé'
  };
  return statusMap[status] || status;
};

const StockEDBSummaryPDF: React.FC<StockEDBSummaryPDFProps> = ({ stockEdb }) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(`${pageURL}/dashboard/etats/stock`);
        setQrCodeImage(qrCodeDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
  }, [stockEdb.edbId]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topSection}>
          <View>
            <Image style={styles.logo} src="/assets/img/touba-app192x192.png" />
            <Text style={styles.tableCell}>Généré par l&apos;appli ToubaApp™</Text>
          </View>
          {qrCodeImage && <Image style={styles.qrCode} src={qrCodeImage} />}
        </View>
        <Image style={styles.watermark} src="/assets/img/touba-logo192x192.png" />

        <View style={styles.section}>
          <Text style={styles.title}>ÉTAT DE BESOIN (STOCK)</Text>
          <Text style={styles.text}>ID: #{stockEdb.edbId}</Text>
          <Text style={styles.text}>
            Demandeur: {stockEdb.employee ? stockEdb.employee.name : stockEdb.externalEmployeeName}
          </Text>
          <Text style={styles.text}>
            Date de création: {new Date(stockEdb.createdAt).toLocaleDateString('fr-FR')}
          </Text>
          <Text style={styles.text}>Département: {stockEdb.department.name}</Text>
          <Text style={styles.text}>Catégorie: {stockEdb.category.name}</Text>
          <Text style={styles.text}>Statut: {getStatusLabel(stockEdb.status)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.header}>Articles Demandés</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>DÉSIGNATION</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>QUANTITÉ</Text>
              </View>
            </View>
            {stockEdb.description.items.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.name}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
          
          {stockEdb.description.comment && (
            <View style={styles.section}>
              <Text style={styles.text}>Commentaire: {stockEdb.description.comment}</Text>
            </View>
          )}
        </View>

        {stockEdb.convertedEdb && (
          <View style={styles.section}>
            <Text style={styles.header}>Détails de Conversion</Text>
            <View style={styles.sectionTwo}>
              <Text style={styles.text}>
                Converti le: {new Date(stockEdb.convertedAt!).toLocaleString('fr-FR')}
              </Text>
              <Text style={styles.text}>
                Converti par: {stockEdb.convertedBy?.name}
              </Text>
              <Text style={styles.text}>
                EDB ID: #{stockEdb.convertedEdb.edbId}
              </Text>
              <Text style={styles.text}>
                Statut: {getStatusLabel(stockEdb.convertedEdb.status)}
              </Text>
            </View>
          </View>
        )}

        {stockEdb.convertedEdb?.auditLogs && stockEdb.convertedEdb.auditLogs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.header}>Chronologie de l&apos;EDB Converti</Text>
            <View style={styles.sectionTwo}>
              {stockEdb.convertedEdb.auditLogs.map((log, index) => (
                <Text key={index} style={styles.text}>
                  {new Date(log.eventAt).toLocaleString('fr-FR')} - {log.eventType} - {log.user.name}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Image style={styles.stamp} src="/path/to/app-stamp.png" />
      </Page>
    </Document>
  );
};

export default StockEDBSummaryPDF;