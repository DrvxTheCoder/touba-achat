// components/templates/ODMSummaryPDF.tsx
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { AccompanyingPerson } from '@/app/dashboard/odm/utils/odm';

const pageURL = "https://touba.vercel.app";
const parseRichTextContent = (content: any) => {
  if (!content || !content.content) return '';

  return content.content.map((node: any) => {
    if (node.type === 'paragraph') {
      const textContent = node.content?.map((textNode: any) => {
        let text = textNode.text || '';
        if (textNode.marks) {
          // You could add styling based on marks, but @react-pdf has limited styling options
          text = textNode.marks.reduce((acc: string, mark: any) => {
            return acc; // Currently just returning text, you can add basic styling if needed
          }, text);
        }
        return text;
      }).join('') || '';

      return textContent + '\n';
    } else if (node.type === 'bulletList') {
      return node.content?.map((listItem: any, index: number) => {
        const itemContent = listItem.content?.[0]?.content?.map((textNode: any) => textNode.text).join('') || '';
        return `• ${itemContent}\n`;
      }).join('') || '';
    }
    return '';
  }).join('');
};

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
    family: 'Inter',
    fonts: [
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf',
        fontWeight: 100,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfMZhrib2Bg-4.ttf',
        fontWeight: 200,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuOKfMZhrib2Bg-4.ttf',
        fontWeight: 300,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
        fontWeight: 400,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf',
        fontWeight: 500,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf',
        fontWeight: 600,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf',
        fontWeight: 700,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYMZhrib2Bg-4.ttf',
        fontWeight: 800,
      },
      {
        src: 'http://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWYMZhrib2Bg-4.ttf',
        fontWeight: 900,
      },
    ],
  });

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
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
      jobTitle: string;
    };
    vehicule: string;
    department: string | { name: string };
    title: string;
    location: string;
    startDate: string | Date;
    endDate: string | Date;
    description: string;
    missionCostPerDay: number;
    totalCost: number;
    expenseItems: ExpenseItem[];
    accompanyingPersons?: AccompanyingPerson[];
  };
  
  timelineEvents: TimelineEvent[];
  isRHUser: boolean;
};

const translateCategory = (category: string): string => {
  switch (category) {
    case 'DIRECTOR': return 'Directeur';
    case 'TEAM_MANAGER': return 'Responsable';
    case 'FIELD_AGENT': return 'Agent / Assistant';
    case 'FREELANCER': return 'Prestataire';
    case 'DRIVER': return 'Chauffeur';
    case 'OTHER': return 'Autres';
    default: return category;
  }
};

const formatNamesWithCategories = (persons: AccompanyingPerson[]): string => {
  if (persons.length === 0) return '';
  
  const formattedPersons = persons.map(person => 
    `${person.name} (${translateCategory(person.category)})`
  );
  
  if (formattedPersons.length === 1) return formattedPersons[0];
  if (formattedPersons.length === 2) 
    return `${formattedPersons[0]} et ${formattedPersons[1]}`;
  
  return `${formattedPersons.slice(0, -1).join(', ')} et ${formattedPersons[formattedPersons.length - 1]}`;
};



const styles = StyleSheet.create({
    boldText: {fontSize: 12, fontWeight: 'bold', fontFamily: 'Oswald'},
    page: { padding: 30, position: 'relative', fontFamily: 'Ubuntu' },
    section: { margin: 0, padding: 10 },
    sectionTwo: { margin: 5, padding: 10, borderWidth: 1, borderStyle: 'dashed', borderRadius: 15 },
    sectionThree: { marginTop: 8 },
    title: { fontSize: 24, marginBottom: 15, textAlign: 'center', fontWeight: 'bold', fontFamily: 'Oswald' },
    header: { fontSize: 18, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    amount: { fontSize: 16 , marginTop: 10, textAlign: 'right', fontWeight: 'bold', fontFamily: 'Oswald' },
    text: { fontSize: 12, lineHeight: 1.5 },
    textbold: { fontSize: 12, lineHeight: 1.5, fontFamily: 'Times-Bold' },
    topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', margin: 10, marginBottom: 10 },
    logo: { width: 50 },
    qrCode: { width: 80, height: 80 },
    watermark: { position: 'absolute', top: '50%', left: '45%', transform: 'translate(-50%, -50%)', opacity: 0.1, width: 200 },
    table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableCol: { width: '50%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
    tableCell: { margin: 'auto', marginTop: 2, marginBottom: 2, fontSize: 10 },
    timeline: { marginTop: 20 },
    stamp: { position: 'absolute', bottom: 50, right: 50, width: 130 },
    stampText: { position: 'absolute', fontSize: 12, bottom: 120, right: 50},
    footer: { marginTop: 50, fontSize: 16, fontFamily: 'Oswald'}
  });

const ODMSummaryPDF: React.FC<ODMSummaryPDFProps> = ({ odm, timelineEvents, isRHUser }) => {

  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);


  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  const missionCost = days * odm.missionCostPerDay;
  const mainMissionCost = days * odm.missionCostPerDay;

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
  
  const formattedPersonsList = formatNamesWithCategories(odm.accompanyingPersons || []);


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
          {odm.missionCostPerDay > 0 ? (
            <Text style={styles.text}>
              Nous soussignés, <Text style={styles.boldText}>TOUBA OIL SAU</Text>, autorisons {odm.creator.name} - {odm.creator.jobTitle}, à se
              rendre à {odm.location}, le {new Date(odm.startDate).toLocaleDateString('fr-FR')} pour la raison suivante: {odm.title}.
            </Text>
          ) : (
            <Text style={styles.text}>
              Nous soussignés, <Text style={styles.boldText}>TOUBA OIL SAU</Text>, autorisons {formattedPersonsList}, à se
              rendre à {odm.location}, le {new Date(odm.startDate).toLocaleDateString('fr-FR')} pour la raison suivante: {odm.title}.
            </Text>
          )}
          {/* <Text style={styles.text}>Utilisateur: {odm.creator.name}</Text>
          <Text style={styles.text}>Date de création: {new Date(odm.createdAt).toLocaleDateString('fr-FR')}</Text>
          <Text style={styles.text}>Département: {getDepartmentName(odm.department)}</Text>
          <Text style={styles.text}>Statut: {odm.status}</Text>
          <Text style={styles.text}>Titre: {odm.title}</Text>
          <Text style={styles.text}>Lieu: {odm.location}</Text> */}
          <View style={styles.sectionThree}>
          <Text style={styles.textbold}>Durée: {`${days} jour(s)`}</Text>
          <Text style={styles.textbold}>Matricule Véhicule: {odm.vehicule || "N/A"}</Text>
          
            {odm.missionCostPerDay > 0 && odm.accompanyingPersons !== undefined && odm.accompanyingPersons.length > 0 && (
              <Text style={styles.text}>
              <Text style={styles.textbold}>Collaborateur(s):</Text>
                {odm.accompanyingPersons?.map((item, index) => (
                  <Text key={index} style={styles.textbold}> {`${item.name} - ${translateCategory(item.category)}`},</Text>
              ))}
              </Text>
            )}
          
          </View>


          <View style={styles.sectionThree}>
            <Text style={styles.text}>
              Description: 
            </Text>
            <Text style={styles.text}>
              {parseRichTextContent(odm.description)}
            </Text>
          </View>

          <View style={styles.sectionThree}>
            <Text style={styles.text}>
                  Cette mission entre dans un cadre strictement professionnel. Son déplacement et ses frais de séjour sont entièrement pris en charge par TOUBA OIL SAU.
            </Text>
          </View>

            
        </View>
        <View style={styles.section}>
          <Text style={styles.header}>Dépenses</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableCol}><Text style={styles.tableCell}>TYPE</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableCell}>MONTANT</Text></View>
            </View>

            {/* Main mission cost */}
            {odm.missionCostPerDay > 0 && (
              <View style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    Frais de mission ({odm.creator.name}) - {`(${odm.missionCostPerDay} x ${days}jr)`}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {mainMissionCost} XOF
                  </Text>
                </View>
              </View>
            )}

            {/* Accompanying persons costs */}
            {odm.accompanyingPersons?.map((person, index) => (
              <View style={styles.tableRow} key={`person-${index}`}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                  Frais de mission ({person.name}) - {`(${person.costPerDay} x ${days}jr)`}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {(person.costPerDay * days)} XOF
                  </Text>
                </View>
              </View>
            ))}


            {/* Additional expenses */}
            {odm.expenseItems.map((item, index) => (
              <View style={styles.tableRow} key={`expense-${index}`}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.type}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{item.amount} XOF</Text>
                </View>
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