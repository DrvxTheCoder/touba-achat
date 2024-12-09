"use client"

import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import BDCSummaryPDF from '@/components/templates/BDCSummaryPDF';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Printer } from 'lucide-react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import { toast } from 'sonner';
import { BDC } from '../types/bdc';

// Translation function for status
const translateStatus = (status: string): string => {
  const statusTranslations: { [key: string]: string } = {
    'SUBMITTED': 'Soumis',
    'APPROVED_RESPONSABLE': 'Approuvé par le Service',
    'APPROVED_DIRECTEUR': 'Approuvé par la Direction',
    'PRINTED': 'Imprimé',
    'REJECTED': 'Rejeté',
    'UPDATED': 'Mis à jour',
  };

  return statusTranslations[status] || status;
};

// Translation function for events
const translateEvent = (eventType: string): string => {
  const eventTranslations: { [key: string]: string } = {
    'SUBMITTED': 'Soumis',
    'APPROVED_RESPONSABLE': 'Approuvé par le Service',
    'APPROVED_DIRECTEUR': 'Approuvé par la Direction',
    'REJECTED': 'Rejeté',
    'UPDATED': 'Mis à jour',
    'PRINTED': 'Imprimé'
  };

  return eventTranslations[eventType] || eventType;
};

interface BDCSummaryPDFDialogProps {
  bdc: BDC;
  onRefresh: () => Promise<void>;
}

export function BDCSummaryPDFDialog({ bdc, onRefresh }: BDCSummaryPDFDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      console.log('Generating PDF...');
      const timelineEvents = bdc.auditLogs?.map(log => ({
        eventAt: log.eventAt.toString(),
        status: translateEvent(log.eventType),
        user: { name: log.user.name }
      })) || [];

      const pdfBlob = await pdf(
        <BDCSummaryPDF 
          bdc={{
            bdcId: bdc.bdcId,
            createdAt: bdc.createdAt,
            title: bdc.title,
            status: translateStatus(bdc.status),
            creator: bdc.creator,
            department: bdc.department,
            description: bdc.description,
            employees: bdc.employees,
            totalAmount: bdc.totalAmount,
            comment: bdc.comment || undefined
          }}
          timelineEvents={timelineEvents}
        />
      ).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return url;
    } catch (err) {
      console.error('Erreur de création PDF:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur de création PDF', {
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
      link.download = `${bdc.bdcId}.pdf`;
      link.click();
    }
  };

  const handleAction = async () => {
    if (bdc.status === 'APPROVED_DIRECTEUR') {
      // Print and mark as printed
      setIsPrinting(true);
      try {
        const response = await fetch(`/api/bdc?id=${bdc.id}&action=print`, {
          method: 'PUT',
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Erreur lors de l\'impression');
        }
  
        await handleDownload();
        toast.success('BDC imprimé avec succès');
        await onRefresh();
      } catch (error) {
        console.error('Print error:', error);
        toast.error('Erreur', {
          description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'impression'
        });
      } finally {
        setIsPrinting(false);
      }
    } else {
      // Just download if already printed
      await handleDownload();
    }
  };

  const handleButtonClick = async (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      await handleAction();
    } else {
      // For desktop, generate the PDF when the dialog opens
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
          disabled={isGenerating || isPrinting}
        >
          {isGenerating || isPrinting ? (
            <SpinnerCircularFixed size={16} thickness={180} speed={100} color="#36ad47" secondaryColor="rgba(0,0,0,0.1)" />
          ) : (
            <>
              {bdc.status === 'PRINTED' ? (
                <>
                  <Download className="h-4 w-4" />
                  <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                    Télécharger
                  </span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                    Imprimer
                  </span>
                </>
              )}
            </>
          )}
        </Button>
      </DialogTrigger>
      {!isMobile && (
        <DialogContent className="max-w-[90vw] max-h-[60vh] md:max-w-[70vw] w-full md:max-h-[90vh] h-full">
          <DialogHeader>
            <DialogTitle>Bon de Caisse: {bdc.bdcId}</DialogTitle>
          </DialogHeader>
          {error ? (
            <center className="text-red-500">Erreur: {error}</center>
          ) : pdfUrl ? (
            <div className="flex flex-col h-full">
              <iframe
                src={pdfUrl}
                className="w-full flex-grow border border-gray-300 rounded h-[42rem]"
                title="BDC Summary PDF Preview"
              />
              <div className="flex flex-row justify-end justify-items-end w-full">
                <Button 
                  onClick={handleAction} 
                  className="mt-4 w-fit"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <SpinnerCircularFixed size={16} thickness={180} speed={100} color="#36ad47" secondaryColor="rgba(0,0,0,0.1)" />
                  ) : (
                    <>
                      {bdc.status === 'PRINTED' ? (
                        <>Télécharger le PDF <Download className="h-4 w-4 ml-2"/></>
                      ) : (
                        <>Imprimer le PDF <Printer className="h-4 w-4 ml-2"/></>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}