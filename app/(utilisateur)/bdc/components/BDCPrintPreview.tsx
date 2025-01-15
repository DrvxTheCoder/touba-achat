'use client';

import { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { Printer, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BonDeCaissePDFTemplate } from './BDCTemplate';

interface PreviewableBDCProps {
  data: BDCData;
}

export const PreviewableBDC = ({ data }: PreviewableBDCProps) => {
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
              <BonDeCaissePDFTemplate data={data} />
            </PDFViewer>
          </div>
        </DialogContent>
      </Dialog>

      <Button 
        onClick={() => {
          window.open(`/api/bdc/${data.id}/pdf`, '_blank');
        }}
        className="gap-2"
        variant="outline"
      >
        <Printer className="h-4 w-4" />
        Imprimer
      </Button>
    </div>
  );
};