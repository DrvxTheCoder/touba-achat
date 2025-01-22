// app/(utilisateur)/bdc/components/PreviewableBDC.tsx
'use client';

import { useState } from 'react';
import { PDFViewer, StyleSheet } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BonDeCaissePDFTemplate, type BDCData } from './BonDeCaissePDFTemplate';

// Styles for the PDFViewer component
const previewStyles = StyleSheet.create({
  viewer: {
    width: '100%',
    height: '100%',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
  }
});

export const PreviewableBDC = ({ data }: { data: BDCData }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    window.open(`/api/bdc/${data.id}/generatePDF`, '_blank');
  };

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
            <PDFViewer style={previewStyles.viewer}>
              <BonDeCaissePDFTemplate data={data} />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      <Button 
        onClick={handlePrint}
        className="gap-2"
        variant="outline"
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </Button>
    </div>
  );
};