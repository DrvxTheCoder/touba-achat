import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import EDBSummaryPDF from '@/components/templates/EDBSummaryPDF';
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

// Updated MinimalEDB type
type MinimalEDB = {
  edbId: string;
  createdAt: string | Date;
  status: string;
  creator: {
    name: string;
    email: string;
  };
  department: {
    name: string;
  } | string;
  description?: {
    items?: Array<{ designation: string; quantity: number }>;
  };
  auditLogs?: Array<{
    eventAt: string | Date;
    eventType: string;
    user: {
      name: string;
    };
  }>;
};

type EDBSummaryPDFDialogProps = {
  edb: MinimalEDB;
};

// Translation function for status
const translateStatus = (status: string): string => {
    const statusTranslations: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'SUBMITTED': 'Soumis',
      'APPROVED_RESPONSABLE': 'Approuvé par le Service',
      'APPROVED_DIRECTEUR': 'Approuvé par la Direction',
      'APPROVED_DG': 'Approuvé par la Direction Générale',
      'AWAITING_MAGASINIER': 'En attente du Magasinier',
      'MAGASINIER_ATTACHED': 'Document attaché par le Magasinier',
      'AWAITING_SUPPLIER_CHOICE': 'En attente du choix du fournisseur',
      'SUPPLIER_CHOSEN': 'Fournisseur choisi',
      'AWAITING_IT_APPROVAL': 'En attente d\'approbation IT',
      'IT_APPROVED': 'Approuvé par IT',
      'AWAITING_FINAL_APPROVAL': 'En attente d\'approbation finale',
      'ESCALATED': 'Escaladé',
      'REJECTED': 'Rejeté',
      'FINAL_APPROVAL': 'Approbation finale',
      'COMPLETED': 'Complété',
    };
  
    return statusTranslations[status] || status;
  };
  
  // Translation function for events
  const translateEvent = (eventType: string): string => {
    const eventTranslations: { [key: string]: string } = {
      'DRAFT_CREATED': 'Brouillon créé',
      'SUBMITTED': 'Soumis',
      'APPROVED_RESPONSABLE': 'Approuvé par le Service',
      'APPROVED_DIRECTEUR': 'Approuvé par la Direction',
      'APPROVED_DG': 'Approuvé par la Direction Générale',
      'REJECTED': 'Rejeté',
      'UPDATED': 'Mis à jour',
      'ATTACHMENT_ADDED': 'Pièce jointe ajoutée',
      'ATTACHMENT_REMOVED': 'Pièce jointe supprimée',
      'ESCALATED': 'Escaladé',
      'MAGASINIER_ATTACHED': 'Document attaché par le Magasinier',
      'SUPPLIER_CHOSEN': 'Fournisseur choisi',
      'AWAITING_FINAL_APPROVAL': 'En attente d\'approbation finale',
      'FINAL_APPROVAL': 'Approbation finale',
      'COMPLETED': 'Complété',
    };
  
    return eventTranslations[eventType] || eventType;
  };

const EDBSummaryPDFDialog: React.FC<EDBSummaryPDFDialogProps> = ({ edb }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const generatePDF = async () => {
      const timelineEvents = edb.auditLogs?.map(log => ({
        eventAt: log.eventAt.toString(),
        status: translateEvent(log.eventType),
        user: { name: log.user.name }
      })) || [];

      const pdfBlob = await pdf(
        <EDBSummaryPDF 
          edb={{
            edbId: edb.edbId,
            createdAt: edb.createdAt.toString(),
            status: translateStatus(edb.status),
            employee: edb.creator, // Changed from employee to creator
            department: typeof edb.department === 'string' ? { name: edb.department } : edb.department,
            description: {
              items: Array.isArray(edb.description?.items) ? edb.description.items : []
            }
          }} 
          timelineEvents={timelineEvents} 
        />
      ).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    };

    generatePDF();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [edb]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${edb.edbId}.pdf`;
      link.click();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
            <FileUp className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[70vw] w-full max-h-[90vh] h-full">
        <DialogHeader>
          <DialogTitle>Résumé de l&apos;État de Besoin: {edb.edbId}</DialogTitle>
        </DialogHeader>
        {pdfUrl ? (
          <div className="flex flex-col h-full">
            <iframe
              src={pdfUrl}
              className="w-full flex-grow border border-gray-300 rounded h-[42rem]"
              title="EDB Summary PDF Preview"
            />
            <div className="flex flex-row justify-end justify-items-end w-full"><Button onClick={handleDownload} className="mt-4 w-fit">Télécharger le PDF <Download className="h-4 w-4 ml-2"/> </Button></div>
            
          </div>
        ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <SpinnerCircularFixed size={90} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EDBSummaryPDFDialog;