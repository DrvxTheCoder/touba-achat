// components/templates/ODMSummaryPDF.tsx
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const pageURL = "https://touba.vercel.app";

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

type ExpenseItem = {
  type: string;
  amount: number;
};

type TimelineEvent = {
  eventAt: string;
  status: string;
  user: {
    name: string;
  };
};

type ODMSummaryPDFProps = {
  odm: {
    odmId: string;
    createdAt: string | Date;
    status: string;
    creator: {
      name: string;
      email: string;
    };
    department: string | { name: string };
    title: string;
    location: string;
    startDate: string | Date;
    endDate: string | Date;
    description: string;
    missionCostPerDay: number;
    totalCost: number;
    expenseItems: ExpenseItem[];
  };
  timelineEvents: TimelineEvent[];
  isRHUser: boolean;
};

const styles = StyleSheet.create({
    boldText: {fontWeight: 'bold'},
    page: { padding: 30, position: 'relative', fontFamily: 'Ubuntu' },
    section: { margin: 5, padding: 10 },
    sectionTwo: { margin: 5, padding: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 15 },
    title: { fontSize: 24, marginBottom: 15, textAlign: 'center', fontWeight: 'bold' },
    header: { fontSize: 18, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
    amount: { fontSize: 16 , marginTop: 10, textAlign: 'right', fontWeight: 'bold' },
    text: { fontSize: 12, marginBottom: 5, lineHeight: 1.5 },
    topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', margin: 10, marginBottom: 20 },
    logo: { width: 50 },
    qrCode: { width: 80, height: 80 },
    watermark: { position: 'absolute', top: '50%', left: '45%', transform: 'translate(-50%, -50%)', opacity: 0.1, width: 200 },
    table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableCol: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
    tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 },
    timeline: { marginTop: 20 },
    stamp: { position: 'absolute', bottom: 50, right: 50, width: 130 },
    stampText: { position: 'absolute', fontSize: 12, bottom: 120, right: 50},
    footer: { marginTop: 50, fontSize: 16}
  });

const ODMSummaryPDF: React.FC<ODMSummaryPDFProps> = ({ odm, timelineEvents, isRHUser }) => {

  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  const missionCost = days * odm.missionCostPerDay;

  const getCompletionDate = () => {
    const completedEvent = timelineEvents.find(event => event.status === 'Traité');
    return completedEvent ? new Date(completedEvent.eventAt) : null;
  };

  const completionDate = getCompletionDate();

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(`${pageURL}/dashboard/odm/${odm.odmId}`);
        setQrCodeImage(qrCodeDataUrl);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };

    generateQRCode();
  }, [odm.odmId]);

  const getDepartmentName = (department: string | { name: string }): string => {
    if (typeof department === 'string') return department;
    return department.name;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topSection}>
          <View><Image style={styles.logo} src="/assets/img/touba-app192x192.png" /> <Text style={styles.tableCell}>Généré par ToubaApp™</Text></View>
          {qrCodeImage && <Image style={styles.qrCode} src={qrCodeImage} />}
        </View>
        <Image style={styles.watermark} src="/assets/img/touba-app512x512-1.png" />
       
        <View style={styles.section}>
          <Text style={styles.title}>ORDRE DE MISSION</Text>
          <Text style={styles.text}>ID : {odm.odmId}</Text>
          <Text style={styles.text}>
            Nous soussignés, <Text style={styles.boldText}>TOUBA OIL SAU</Text>, autorisons {odm.creator.name}, à se
            rendre à {odm.location}, le {new Date(odm.startDate).toLocaleDateString('fr-FR')} pour la raison suivante: {odm.title}.
          </Text>
          {/* <Text style={styles.text}>Utilisateur: {odm.creator.name}</Text>
          <Text style={styles.text}>Date de création: {new Date(odm.createdAt).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.text}>Département: {getDepartmentName(odm.department)}</Text>
          <Text style={styles.text}>Statut: {odm.status}</Text>
          <Text style={styles.text}>Titre: {odm.title}</Text>
          <Text style={styles.text}>Lieu: {odm.location}</Text> */}
          <Text style={styles.text}>Durée: {`${days} jour(s)`}</Text>
          <Text style={styles.text}>
                Cette mission entre dans un cadre strictement professionnel.
            </Text>
            
            <Text style={styles.text}>
                Son déplacement et ses frais de séjour sont entièrement pris en charge par TOUBA OIL SAU.
            </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.header}>Dépenses</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>TYPE</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>MONTANT</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>Frais de Mission</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>{missionCost} XOF</Text></View>
            </View>
            {odm.expenseItems.map((item, index) => (
              <View style={styles.tableRow} key={index}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.type}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{item.amount} XOF</Text></View>
              </View>
            ))}
          </View>
          <Text style={styles.amount}>Total: {odm.totalCost} XOF</Text>
        </View>
        <View style={styles.section}>
        <Text style={styles.text}>
            NB : Tout frais liés au voyage devront être justifiés au niveau de la comptabilité
            dès le retour.
          </Text>
        </View>
        
        {completionDate && (
            <View style={styles.section}>
                <Text style={styles.footer}>
                    Fait à Dakar, le {completionDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </Text>
            </View>

        )}
        {isRHUser && (
            <>
                <Text style={styles.stampText}>Direction des Ressources Humaines</Text>
                <Image style={styles.stamp} src="/assets/img/cachet-drh.jpeg" />
            </>
        )}
      </Page>
    </Document>
  );
};

export default ODMSummaryPDF;