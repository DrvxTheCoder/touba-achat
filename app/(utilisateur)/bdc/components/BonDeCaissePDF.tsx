// components/BonDeCaissePDF.tsx
"use client "
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
    width: 100,
    height: 20,
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
    name: string;
  } | null;
}

export const BonDeCaissePDF = ({ data }: { data: BDCData }) => {
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

  return (
    <Document>
      <Page size={[PAPER_WIDTH, 'auto']} style={styles.page}>
        <View style={styles.logoContainer}>
          <Image style={styles.logo} src="/assets/img/logo-black.png" />
        </View>
        <Text style={styles.text}>BON DE CAISSE</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.label}>N° BDC:</Text>
          <Text style={styles.value}>{data.bdcId}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatDate(data.createdAt)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Demandeur:</Text>
          <Text style={styles.value}>{data.creator.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Matricule:</Text>
          <Text style={styles.value}>{data.creator.matriculation}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>Département:</Text>
          <Text style={styles.value}>{data.department.name}</Text>
        </View>
        
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.columnHeader}>Articles/Objet</Text>
          <Text style={styles.columnValue}>Montant XOF</Text>
        </View>
        
        {data.description.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.itemDescription}>
              {item.item}
            </Text>
            <Text style={styles.value}>{formatAmount(item.amount)}</Text>
          </View>
        ))}
        
        <View style={styles.divider} />
        
        <View style={[styles.row, styles.total]}>
          <Text style={styles.label}>Total XOF:</Text>
          <Text style={styles.value}>{formatAmount(data.totalAmount)}</Text>
        </View>
        
        <View style={styles.divider} />
        
        {/* {data.approver && (
          <View style={styles.row}>
            <Text style={styles.label}>Approuvé par:</Text>
            <Text style={styles.value}>{data.approver.name}</Text>
          </View>
        )} */}
        
        {data.approverDAF && (
          <View style={styles.row}>
            <Text style={styles.label}>Approbation DAF:</Text>
            <Text style={styles.value}>{data.approverDAF.name}</Text>
          </View>
        )}

        {data.printedBy && (
          <View style={styles.row}>
            <Text style={styles.label}>Decaissé par:</Text>
            <Text style={styles.value}>{data.printedBy.name}</Text>
          </View>
        )}
        
        <Text style={styles.footer}>
          Imprimé le {new Date().toLocaleString('fr-FR')}
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