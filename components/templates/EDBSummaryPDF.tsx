import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const pageURL = "https://touba.vercel.app";

Font.register({
  family: 'Ubuntu',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf',
      fontWeight: 'bold',
    }
  ],
}); 

// Define types
type EDBItem = {
  designation: string;
  quantity: number;
};

type TimelineEvent = {
  eventAt: string;
  status: string;
  user: {
    name: string;
  };
};

type EDBSummaryPDFProps = {
  edb: {
    edbId: string;
    createdAt: string | Date;
    status: string;
    employee: {
      name: string;
      email: string;
    }
    finalAmount? : number;
    department?: string | { name: string };
    description?: {
      items?: EDBItem[];
    };
  };
  timelineEvents: TimelineEvent[];
};

// Define styles
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


const EDBSummaryPDF: React.FC<EDBSummaryPDFProps> = ({ edb, timelineEvents }) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(`${pageURL}/dashboard/etats/${edb.edbId}`);
        setQrCodeImage(qrCodeDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
  }, [edb.edbId]);

  const getDepartmentName = (department: string | { name: string } | undefined): string => {
    if (typeof department === 'string') return department;
    if (department && 'name' in department) return department.name;
    return 'Non spécifié';
  };
  console.log(edb);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topSection}>
          <View><Image style={styles.logo} src="/assets/img/touba-app192x192.png" /> <Text style={styles.tableCell}>Généré par l&apos;appli ToubaApp™</Text></View>
          {qrCodeImage && <Image style={styles.qrCode} src={qrCodeImage} />}
        </View>
        <Image style={styles.watermark} src="/assets/img/touba-logo192x192.png" />
       
        <View style={styles.section}>
          <Text style={styles.title}>ÉTAT DE BESOIN</Text>
          <Text style={styles.text}>ID: #{edb.edbId}</Text>
          <Text style={styles.text}>Utilisateur: {edb.employee.name}</Text>
          <Text style={styles.text}>Date: {new Date(edb.createdAt).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.text}>Département: {getDepartmentName(edb.department)}</Text>
          <Text style={styles.text}>Statut: {edb.status}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.header}>Articles</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>DÉSIGNATION</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>QUANTITÉ</Text></View>
            </View>
            {edb.description?.items && Array.isArray(edb.description.items) && edb.description.items.length > 0 ? (
              edb.description.items.map((item, index) => (
                <View style={styles.tableRow} key={index}>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{item.designation}</Text></View>
                  <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
                </View>
              ))
            ) : (
              <Text style={styles.text}>Aucun article spécifié</Text>
            )}
          </View>
          {edb.finalAmount && (
            <Text style={styles.amount}>Total: {edb.finalAmount} XOF</Text>
          )}
          
        </View>
        <View style={styles.section}>
          <Text style={styles.header}>Chronologie de Validation</Text>
            <View style={styles.sectionTwo}>
              {timelineEvents.length > 0 ? (
              timelineEvents.map((event, index) => (
                <Text key={index} style={styles.text}>
                  {new Date(event.eventAt).toLocaleString('fr-FR')} - {event.status} - {event.user.name}
                </Text>
              ))
            ) : (
              <Text style={styles.text}>Aucun événement de validation</Text>
            )}
            </View>
        </View>
        <Image style={styles.stamp} src="/path/to/app-stamp.png" />
      </Page>
    </Document>
  );
};

export default EDBSummaryPDF;