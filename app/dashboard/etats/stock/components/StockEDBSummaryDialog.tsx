// components/stock/StockEDBPDFDialog.tsx
import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import StockEDBSummaryPDF from '@/components/templates/StockEDBSummaryPDF';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileUp } from 'lucide-react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import { toast } from 'sonner';
import { StockDetails, StockEDB } from '@/app/dashboard/etats/stock/types/stock-edb';

type StockEDBPDFDialogProps = {
  stockEdb: StockDetails;
};

// Helper function to convert string dates to Date objects and ensure required properties
const convertToStockEDB = (details: StockDetails): StockEDB => {
  return {
    ...details,
    createdAt: new Date(details.createdAt),
    convertedAt: details.convertedAt ? new Date(details.convertedAt) : undefined,
    category: {
      id: details.category.id || 0, // Provide a default if missing
      name: details.category.name
    }
  };
};

const StockEDBPDFDialog: React.FC<StockEDBPDFDialogProps> = ({ stockEdb }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      console.log('Generating Stock EDB PDF...');

      // Convert the stockEdb to the correct type
      const convertedStockEdb = convertToStockEDB(stockEdb);

      const pdfBlob = await pdf(
        <StockEDBSummaryPDF stockEdb={convertedStockEdb} />
      ).toBlob();

      console.log('Stock EDB PDF blob generated');

      const url = URL.createObjectURL(pdfBlob);
      console.log('PDF URL created:', url);
      setPdfUrl(url);
      return url;
    } catch (err) {
      console.error('Erreur de création PDF:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur de création PDF:', {
        description: err instanceof Error ? err.message : 'Erreur inconnue',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    let url = pdfUrl;
    if (!url) {
      url = await generatePDF();
    }
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${stockEdb.edbId}-stock.pdf`;
      link.click();
    }
  };

  const handleButtonClick = async (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      await handleDownload();
    } else {
      await generatePDF();
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 gap-1"
          onClick={handleButtonClick}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <SpinnerCircularFixed size={16} thickness={180} speed={100} color="#36ad47" secondaryColor="rgba(0,0,0,0.1)" />
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              {/* <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap hidden md:block">
                Exporter
              </span> */}
            </>
          )}
        </Button>
      </DialogTrigger>
      {!isMobile && (
        <DialogContent className="max-w-[90vw] max-h-[60vh] md:max-w-[70vw] w-full md:max-h-[90vh] h-full">
          <DialogHeader>
            <DialogTitle>Résumé EDB Stock: {stockEdb.edbId}</DialogTitle>
          </DialogHeader>
          {error ? (
            <center className="text-red-500">Error: {error}</center>
          ) : pdfUrl ? (
            <div className="flex flex-col h-full">
              <iframe
                src={pdfUrl}
                className="w-full flex-grow border border-gray-300 rounded h-[42rem]"
                title="Stock EDB Summary PDF Preview"
              />
              <div className="flex flex-row justify-end justify-items-end w-full">
                <Button onClick={handleDownload} className="mt-4 w-fit">
                  Télécharger le PDF <Download className="h-4 w-4 ml-2"/>
                </Button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <SpinnerCircularFixed 
                size={90} 
                thickness={100} 
                speed={100} 
                color="#36ad47" 
                secondaryColor="rgba(73, 172, 57, 0.23)" 
              />
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default StockEDBPDFDialog;