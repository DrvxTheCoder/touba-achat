// components/templates/BDCSummaryPDF.tsx
import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';

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

type ExpenseItem = {
  item: string;
  amount: number;
};

type EmployeeInfo = {
  name: string;
  role: string;
};

type TimelineEvent = {
  eventAt: string;
  status: string;
  user: {
    name: string;
  };
};

type BDCSummaryPDFProps = {
  bdc: {
    bdcId: string;
    createdAt: string;
    title: string;
    status: string;
    creator: {
      name: string;
      email: string;
    };
    department: {
      name: string;
    };
    description: ExpenseItem[];
    employees: EmployeeInfo[];
    totalAmount: number;
    comment?: string;
  };
  timelineEvents: TimelineEvent[];
};

const styles = StyleSheet.create({
  page: { padding: 30, position: 'relative', fontFamily: 'Ubuntu' },
  section: { margin: 10, padding: 10 },
  sectionTwo: { margin: 5, padding: 10, },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  header: { fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  amount: { fontSize: 16, marginTop: 10, textAlign: 'right', fontWeight: 'bold' },
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

const BDCSummaryPDF: React.FC<BDCSummaryPDFProps> = ({ bdc, timelineEvents }) => {
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(`${pageURL}/dashboard/bdc/${bdc.bdcId}`);
        setQrCodeImage(qrCodeDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
  }, [bdc.bdcId]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topSection}>
          <View>
            <Image style={styles.logo} src="/assets/img/touba-app192x192.png" />
            <Text style={styles.tableCell}>Généré par l&apos;appli ToubaApp™</Text>
          </View>
          {/* {qrCodeImage && <Image style={styles.qrCode} src={qrCodeImage} />} */}
        </View>
        <Image style={styles.watermark} src="/assets/img/touba-logo192x192.png" />

        <View style={styles.section}>
          <Text style={styles.title}>BON DE CAISSE</Text>
          <Text style={styles.text}>ID: #{bdc.bdcId}</Text>
          <Text style={styles.text}>Titre: {bdc.title}</Text>
          <Text style={styles.text}>Demandeur: {bdc.creator.name}</Text>
          <Text style={styles.text}>Date: {new Date(bdc.createdAt).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.text}>Département: {bdc.department.name}</Text>
          <Text style={styles.text}>Statut: {bdc.status}</Text>
            <Text style={styles.text}>
                Employé(s) concerné(s): {' '}
            {bdc.employees.map((emp, index) => (
              <Text key={index} style={styles.text}>
                {emp.name} - {emp.role}
              </Text>
            ))}
            </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.header}>Articles et Montants</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>ARTICLE</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>MONTANT</Text></View>
            </View>
            {bdc.description.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.item}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.amount} XOF</Text></View>
              </View>
            ))}
          </View>
          <Text style={styles.amount}>Total: {bdc.totalAmount.toLocaleString()} XOF</Text>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.header}>Employés Concernés</Text>
          <View style={styles.sectionTwo}>
            {bdc.employees.map((emp, index) => (
              <Text key={index} style={styles.text}>
                {emp.name} - {emp.role}
              </Text>
            ))}
          </View>
        </View> */}

        {bdc.comment && (
          <View style={styles.section}>
            <Text style={styles.text}>Commentaire: {bdc.comment}</Text>
          </View>
        )}

        {/* <View style={styles.section}>
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
        </View> */}
      </Page>
    </Document>
  );
};

export default BDCSummaryPDF;