// components/PrintBDCButton.tsx
"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from 'sonner';

interface PrintBDCButtonProps {
  bdcId: number;
  onPrintComplete?: () => void;
}

export const PrintBDCButton = ({ bdcId, onPrintComplete }: PrintBDCButtonProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    try {
      setIsPrinting(true);

      // Open PDF in a new window using the API route
      const printWindow = window.open(`/api/bdc/${bdcId}/generatePDF`, '_blank');
      
      if (printWindow) {
        printWindow.onload = async () => {
          printWindow.print();
          
          // Watch for print dialog close
          const checkPrintClosed = setInterval(async () => {
            if (printWindow.closed) {
              clearInterval(checkPrintClosed);
              
              try {
                // Mark BDC as printed
                const markResponse = await fetch(`/api/bdc?id=${bdcId}&action=print`, {
                  method: 'PUT'
                });

                if (!markResponse.ok) {
                  const error = await markResponse.json();
                  throw new Error(error.error || 'Failed to mark BDC as printed');
                }

                toast.success("Bon de caisse imprimé avec succès");
                onPrintComplete?.();
              } catch (error) {
                console.error('Error marking BDC as printed:', error);
                toast.warning("Impression réussi sans la mise à jour du BDC");
              }
            }
          }, 1000);
        };
      }
    } catch (error) {
      console.error('Print error:', error);
      toast.error("Une erreur est survenue lors de l'impression");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Button
      onClick={handlePrint}
      disabled={isPrinting}
      className="gap-2"
      variant="outline"
    >
      <Printer className="h-4 w-4" />
      {isPrinting ? "Impression..." : "Imprimer"}
    </Button>
  );
};