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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, FileUp, Printer } from 'lucide-react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useMediaQuery } from '@/app/hooks/use-media-query';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type ODMSummaryPDFDialogProps = {
  odm: any; // Replace with a proper ODM type
};

const translateStatus = (status: string): string => {
  const statusTranslations: { [key: string]: string } = {
    'DRAFT': 'Brouillon',
    'SUBMITTED': 'Soumis',
    'AWAITING_DIRECTOR_APPROVAL': 'En attente d\'approbation du directeur',
    'AWAITING_DRH_APPROVAL': 'En attente DRH',
    'AWAITING_RH_PROCESSING': 'En attente DRH',
    'RH_PROCESSING': 'En cours de traitement RH',
    'AWAITING_DRH_VALIDATION': 'En attente de validation DRH',
    'AWAITING_DOG_APPROVAL': 'En attente d\'approbation DOG',
    'AWAITING_FINANCE_APPROVAL': 'Traité',
    'READY_FOR_PRINT': 'Prêt pour impression',
    'COMPLETED': 'Imprimé',
    'REJECTED': 'Rejeté',
  };

  return statusTranslations[status] || status;
};

const translateEvent = (eventType: string): string => {
  const eventTranslations: { [key: string]: string } = {
    'DRAFT': 'Brouillon créé',
    'SUBMITTED': 'Soumis',
    'AWAITING_DIRECTOR_APPROVAL': 'En attente d\'approbation du directeur',
    'AWAITING_DRH_APPROVAL': 'Approuvé par le Directeur - En attente DRH',
    'AWAITING_RH_PROCESSING': 'Approuvé par la Direction',
    'RH_PROCESSING': 'Envoyé pour traitement RH',
    'AWAITING_DRH_VALIDATION': 'Traité par RH - En attente validation DRH',
    'AWAITING_DOG_APPROVAL': 'Validé par DRH - En attente approbation DOG',
    'AWAITING_FINANCE_APPROVAL': 'Traité',
    'READY_FOR_PRINT': 'Approuvé par DOG - Prêt pour impression',
    'COMPLETED': 'Imprimé',
    'REJECTED': 'Rejeté',
    'UPDATED': 'Mis à jour',
    'RESTARTED': 'Redémarré par DRH',
  };

  return eventTranslations[eventType] || eventType;
};

const ODMSummaryPDFDialog: React.FC<ODMSummaryPDFDialogProps> = ({ odm }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrintWarningOpen, setIsPrintWarningOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: session } = useSession();
  const router = useRouter();

  const isRHUser = session?.user.role === "RH";
  const isDOGApproved = odm.status === 'READY_FOR_PRINT' || odm.status === 'COMPLETED';
  const isRejected = odm.status === 'REJECTED';
  const isPrintReady = odm.status === 'READY_FOR_PRINT';
  const canMarkAsPrinted = ['RH', 'DRH', 'ADMIN'].includes(session?.user?.role || '');

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
          }}
          timelineEvents={timelineEvents}
          isRHUser={isRHUser}
          isDOGApproved={isDOGApproved}
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

  /**
   * Opens the PDF in a new tab. When the tab is closed, marks the ODM as COMPLETED.
   * The window is opened synchronously (before any await) to avoid popup blockers.
   */
  const handleConfirmPrint = () => {
    // Open window synchronously in the click handler to avoid popup blocker
    const printWindow = window.open('about:blank', '_blank');
    setIsPrintWarningOpen(false);
    setIsPrinting(true);

    (async () => {
      try {
        let url = pdfUrl;
        if (!url) {
          url = await generatePDF();
        }

        if (url && printWindow && !printWindow.closed) {
          printWindow.location.href = url;

          toast.info('Impression en cours...', {
            description: 'Fermez l\'onglet une fois l\'impression terminée pour marquer l\'ODM comme imprimé.',
            duration: 6000,
          });

          const pollInterval = setInterval(async () => {
            if (printWindow.closed) {
              clearInterval(pollInterval);
              try {
                const response = await fetch(`/api/odm/${odm.id}/print`, {
                  method: 'POST',
                });

                if (!response.ok) {
                  const errData = await response.json();
                  throw new Error(errData.error || 'Erreur lors du marquage');
                }

                toast.success('ODM marqué comme imprimé', {
                  description: `L'ODM #${odm.odmId} a été marqué comme imprimé avec succès.`,
                });
                router.refresh();
              } catch (err: any) {
                toast.error('Erreur', {
                  description: err.message || 'Impossible de marquer l\'ODM comme imprimé.',
                });
              } finally {
                setIsPrinting(false);
              }
            }
          }, 500);
        } else {
          if (printWindow && !printWindow.closed) printWindow.close();
          setIsPrinting(false);
        }
      } catch (err: any) {
        if (printWindow && !printWindow.closed) printWindow.close();
        toast.error('Erreur', {
          description: err.message || 'Erreur lors de la génération du PDF.',
        });
        setIsPrinting(false);
      }
    })();
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={handleButtonClick}
            disabled={isRejected || isGenerating}
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
                <div className="flex flex-row justify-end items-center gap-2 w-full">
                  {isPrintReady && canMarkAsPrinted && (
                    <Button
                      onClick={() => setIsPrintWarningOpen(true)}
                      variant="outline"
                      className="mt-4 w-fit"
                      disabled={isPrinting}
                    >
                      {isPrinting ? (
                        <SpinnerCircularFixed size={16} thickness={180} speed={100} color="#36ad47" secondaryColor="rgba(0,0,0,0.1)" />
                      ) : (
                        <>
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimer
                        </>
                      )}
                    </Button>
                  )}
                  <Button onClick={handleDownload} className="mt-4 w-fit">
                    Télécharger le PDF <Download className="h-4 w-4 ml-2" />
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

      {/* Print confirmation warning dialog */}
      <AlertDialog open={isPrintWarningOpen} onOpenChange={setIsPrintWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l&apos;impression</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Cette action va ouvrir le document dans un nouvel onglet pour impression.
                </p>
                <br />
                <p>
                  Lorsque vous <strong>fermerez cet onglet</strong>, l&apos;ODM{' '}
                  <strong>#{odm.odmId}</strong> sera automatiquement marqué comme{' '}
                  <strong>Imprimé</strong>.
                </p>
                <br />
                <p>Souhaitez-vous continuer ?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPrint}>
              Ouvrir pour impression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ODMSummaryPDFDialog;
