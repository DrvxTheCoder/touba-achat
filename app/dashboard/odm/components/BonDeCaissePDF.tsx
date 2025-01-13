// components/BonDeCaissePDF.tsx
import { useState } from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer,
  Image,
  Font
} from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 80mm = 226.772 points in PDF
const PAPER_WIDTH = 226.772;
const MARGIN = 25;
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
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 20,
    marginBottom: 5,
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
  label: {
    flex: 1,
  },
  value: {
    flex: 1,
    textAlign: 'right',
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
  }
});

interface BDCData {
  edbId: string;
  date: string;
  department: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  total: number;
  approvedBy: string;
}

const BonDeCaissePDF = ({ data }: { data: BDCData }) => {
  return (
    <Document>
      <Page size={[PAPER_WIDTH, 'auto']} style={styles.page}>
      <View style={styles.logoContainer}>
          <Image style={styles.logo} src="/assets/img/logo-black.png" />
        </View>
        <Text style={styles.text}>BON DE CAISSE</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{data.edbId}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Département:</Text>
          <Text style={styles.value}>{data.department}</Text>
        </View>
        
        <View style={styles.divider} />
        
        {data.items.map((item, index) => (
          <View key={index}>
            <Text style={styles.itemDescription}>
              {item.description}
            </Text>
            <Text style={styles.itemDetails}>
              {`${item.quantity} x ${item.unitPrice}`}
            </Text>
            <View style={styles.row}>
              <Text style={styles.value}>{item.total}</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.divider} />
        
        <View style={[styles.row, styles.total]}>
          <Text style={styles.label}>Total XOF:</Text>
          <Text style={styles.value}>{data.total}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.label}>Approuvé par:</Text>
          <Text style={styles.value}>{data.approvedBy}</Text>
        </View>
        
        <Text style={styles.footer}>
          {new Date().toLocaleString('fr-FR')}
        </Text>
      </Page>
    </Document>
  );
};


export const PrintableBDC = ({ data }: { data: BDCData }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex gap-2">
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <Button 
          onClick={() => setShowPreview(true)}
          variant="outline"
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Aperçu
        </Button>

        <DialogContent className="max-w-screen-lg h-[80vh]">
          <DialogHeader>
            <DialogTitle>Aperçu du Bon de Caisse</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-[70vh] min-h-0">
            <PDFViewer style={styles.viewer}>
              <BonDeCaissePDF data={data} />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      <Button 
        onClick={() => {
          window.print();
        }}
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </Button>
    </div>
  );
};