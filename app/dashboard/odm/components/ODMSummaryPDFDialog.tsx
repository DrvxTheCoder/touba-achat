// components/ODMSummaryPDFDialog.tsx
import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import ODMSummaryPDF from '@/components/templates/ODMSummaryPDF';
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
import { useSession } from 'next-auth/react';

type ODMSummaryPDFDialogProps = {
  odm: any; // Replace with a proper ODM type
};

const translateStatus = (status: string): string => {
  const statusTranslations: { [key: string]: string } = {
    'DRAFT': 'Brouillon',
    'SUBMITTED': 'Soumis',
    'AWAITING_DIRECTOR_APPROVAL': 'En attente d\'approbation du directeur',
    'AWAITING_RH_PROCESSING': 'Approuvé par la Direction',
    'RH_PROCESSING': 'En cours de traitement RH',
    'COMPLETED': 'Traité',
    'REJECTED': 'Rejeté',
  };

  return statusTranslations[status] || status;
};

const translateEvent = (eventType: string): string => {
  const eventTranslations: { [key: string]: string } = {
    'DRAFT': 'Brouillon créé',
    'SUBMITTED': 'Soumis',
    'AWAITING_DIRECTOR_APPROVAL': 'En attente d\'approbation du directeur',
    'AWAITING_RH_PROCESSING': 'Approuvé par la Direction',
    'RH_PROCESSING': 'En cours de traitement RH',
    'COMPLETED': 'Traité',
    'REJECTED': 'Rejeté',
    'UPDATED': 'Mis à jour',
  };

  return eventTranslations[eventType] || eventType;
};

const ODMSummaryPDFDialog: React.FC<ODMSummaryPDFDialogProps> = ({ odm }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: session, status } = useSession();
  const isRHUser = session?.user.role === "RH";

  

  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const timelineEvents = odm.auditLogs?.map((log: any) => ({
        eventAt: log.eventAt.toString(),
        status: translateEvent(log.eventType),
        user: { name: log.user.name }
      })) || [];

      const pdfBlob = await pdf(
        <ODMSummaryPDF 
          odm={{
            ...odm,
            status: translateStatus(odm.status),
            department: typeof odm.department === 'string' ? { name: odm.department } : odm.department,
            jobTile: typeof odm.jobTitle === 'string'
          }}
          timelineEvents={timelineEvents}
          isRHUser = {isRHUser}
        />
      ).toBlob();

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return url;
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Error generating PDF', {
        description: err instanceof Error ? err.message : 'An unknown error occurred',
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
      link.download = `${odm.odmId}.pdf`;
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
              <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap hidden md:block">
                Exporter
              </span>
            </>
          )}
        </Button>
      </DialogTrigger>
      {!isMobile && (
        <DialogContent className="max-w-[90vw] max-h-[60vh] md:max-w-[70vw] w-full md:max-h-[90vh] h-full">
          <DialogHeader>
            <DialogTitle>Résumé de l&apos;Ordre de Mission: {odm.odmId}</DialogTitle>
          </DialogHeader>
          {error ? (
            <center className="text-red-500">Error: {error}</center>
          ) : pdfUrl ? (
            <div className="flex flex-col h-full">
              <iframe
                src={pdfUrl}
                className="w-full flex-grow border border-gray-300 rounded h-[42rem]"
                title="ODM Summary PDF Preview"
              />
              <div className="flex flex-row justify-end justify-items-end w-full">
                <Button onClick={handleDownload} className="mt-4 w-fit">
                  Télécharger le PDF <Download className="h-4 w-4 ml-2"/>
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
};

export default ODMSummaryPDFDialog;