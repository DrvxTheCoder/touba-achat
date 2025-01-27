import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {toast} from "sonner"


interface PrintBDCProps {
  bdcId: string;
  onPrintComplete?: () => void;
}

export const PrintBDC = ({ bdcId, onPrintComplete }: PrintBDCProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);

      // 1. Generate PDF blob URL
      const response = await fetch(`/api/generate-bdc-pdf/${bdcId}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // 2. Open print dialog directly
      const printWindow = window.open(blobUrl);
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          
          // Listen for print dialog close
          const checkPrintClosed = setInterval(async () => {
            if (printWindow.closed) {
              clearInterval(checkPrintClosed);
              URL.revokeObjectURL(blobUrl);

              try {
                // Mark BDC as printed
                const markResponse = await fetch(`/api/mark-bdc-printed/${bdcId}`, {
                  method: 'POST',
                });

                if (!markResponse.ok) {
                  throw new Error('Failed to mark BDC as printed');
                }

                toast.success("Succès", {
                  description: "Bon de caisse imprimé avec succès",
                });

                onPrintComplete?.();
              } catch (error) {
                console.error('Error marking BDC as printed:', error);
                toast.warning("Attention",{
                  description: "L'impression a réussi mais l'état n'a pas été mis à jour",
                });
              }
            }
          }, 1000);
        };
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error("Erreur",{
        description: "Une erreur est survenue lors de l'impression",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={isPrinting}
      className="gap-2"
    >
      <Printer className="h-4 w-4" />
      {isPrinting ? "Impression..." : "Imprimer"}
    </Button>
  );
};