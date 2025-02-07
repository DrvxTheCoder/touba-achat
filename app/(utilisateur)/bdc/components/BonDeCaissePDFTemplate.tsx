// app/(utilisateur)/bdc/components/BonDeCaissePDFTemplate.tsx
// This is the server component (no 'use client')
import { 
    Document, 
    Page, 
    Text, 
    View, 
    StyleSheet,
    Image,
    Font,
    DocumentProps
  } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const pageURL = "https://touba-app.com";
  
// 80mm = 226.772 points in PDF
const PAPER_WIDTH = 226.772;
const MARGIN = 15;
const CONTENT_WIDTH = PAPER_WIDTH - (MARGIN * 2);

Font.register({
  family: 'Oswald',
  src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

// Using built-in fonts only
const styles = StyleSheet.create({
  viewer: {
    width: '100%',
    height: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
  },
  page: {
    width: PAPER_WIDTH,
    backgroundColor: 'white',
    padding: MARGIN,
    fontFamily: 'Courier',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Oswald'
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 2,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 0,
  },

  header: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Courier'
  },
  headerBold: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Oswald',
  },
  divider: {
    borderBottom: 1,
    borderStyle: 'dashed',
    width: '100%',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
    fontSize: 10,
  },
  columnHeader: {
    flex: 1,
    fontFamily: 'Oswald',
  },
  columnValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Oswald',
  },
  label: {
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  labeltwo: {
    flex: 1,
    fontSize: 8,
  },
  valuetwo: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
  },
  itemDescription: {
    fontSize: 10,
    marginTop: 2,
  },
  itemDetails: {
    fontSize: 10,
    marginLeft: 10,
  },
  total: {
    fontFamily: 'Courier-Bold',
    fontSize: 11,
  },
  footer: {
    marginTop: 5,
    fontSize: 8,
    textAlign: 'center',
  },
  qrCode: { width: 50, height: 50, marginBottom: 5 },
});

interface ExpenseItem {
    item: string;
    amount: number;
  }

  
  interface BDCData {
    id: number;
    bdcId: string;
    title: string;
    description: ExpenseItem[];
    totalAmount: number;
    status: string;
    createdAt: string;
    departmentId: number;
    department: {
      id: number;
      name: string;
    };
    creator: {
      name: string;
      matriculation: string;
      jobTitle: string;
    };
    approver?: {
      name: string;
    } | null;
    approverDAF?: {
        name: string;
      } | null;
    printedBy?: {
      name: string | undefined;
    } | null;
  }
  
  // This is the template component that will be used by the API
  const BonDeCaissePDFTemplate = ({ data }: { data: BDCData }): React.ReactElement<DocumentProps> => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
  
    const formatAmount = (amount: number) => {
      return amount.toLocaleString('fr-FR');
    };

    
    const qrCodeDataUrl = QRCode.toDataURL(`${pageURL}/bdc?bdcId=${data.bdcId}`);

  
    return (
        <Document>
        <Page size={[PAPER_WIDTH, 'auto']} style={styles.page}>
          <View style={styles.logoContainer}>
            <Image style={styles.logo} src="https://touba-app.com/assets/img/touba-logo-192x.png" />
          </View>
          <Text style={styles.text}>BON DE CAISSE</Text>
          
          
          <View style={styles.row}>
            <Text style={styles.label}>{data.bdcId}</Text>
            <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
          </View> 

          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.labeltwo}>Demandeur:</Text>
            <Text style={styles.valuetwo}>{data.creator.name}</Text>
          </View>
  
          <View style={styles.row}>
            <Text style={styles.labeltwo}>Matricule:</Text>
            <Text style={styles.valuetwo}>{data.creator.matriculation}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.labeltwo}>Département:</Text>
            <Text style={styles.valuetwo}>{data.department.name}</Text>
          </View>
          
          <View style={styles.divider} />
          <View style={styles.row} >
            
          </View>
  
          <View style={styles.row}>
            <Text style={styles.columnHeader}>Articles/Objet</Text>
            <Text style={styles.columnValue}>Montant XOF</Text>
          </View>
          
          {data.description.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.itemDescription}>
                {item.item}
              </Text>
              <Text style={styles.value}>{item.amount}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={[styles.row, styles.total]}>
            <Text style={styles.label}>Total XOF:</Text>
            <Text style={styles.value}>{data.totalAmount}</Text>
          </View>
          
          <View style={styles.divider} />
          
          {data.approver && (
            <View style={styles.row}>
              <Text style={styles.labeltwo}>Approuvé par:</Text>
              <Text style={styles.valuetwo}>{data.approver.name}</Text>
            </View>
          )}

        {data.approverDAF && (
        <View style={styles.row}>
            <Text style={styles.labeltwo}>Approbation DAF:</Text>
            <Text style={styles.valuetwo}>{data.approverDAF.name}</Text>
        </View>
        )}
  
          {data.printedBy && (
            <View style={styles.row}>
              <Text style={styles.labeltwo}>Decaissé par:</Text>
              <Text style={styles.valuetwo}>{data.printedBy.name}</Text>
            </View>
          )}
          
          <Text style={styles.footer}>
            Imprimé le {new Date().toLocaleString('fr-FR')}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.footer}>
              <Image style={styles.qrCode} src={qrCodeDataUrl} />
            </Text>
          </View>
        </Page>
      </Document>
    );
  };
  
  export { BonDeCaissePDFTemplate };
  export type { BDCData };