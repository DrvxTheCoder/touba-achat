import React from 'react';
import { User, Stamp, Package, ShoppingCart, CheckCircle2, Printer, ArrowUpRight, XCircle, FileText, Paperclip, PrinterCheck, PackageOpenIcon } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { EDBStatus, EDBEventType } from '@/app/(utilisateur)/etats-de-besoin/data/types';
import { Separator } from "@/components/ui/separator"

type EDBTimelineProps = {
  edb: {
    id: string;
    edbId: string;
    status: EDBStatus;
    auditLogs: {
      id: number;
      eventType: EDBEventType;
      eventAt: string;
      user: {
        name: string;
      };
    }[];
  };
};

const eventTypeIcons: Record<EDBEventType, React.ElementType> = {
  DRAFT_CREATED: User,
  SUBMITTED: FileText,
  APPROVED_RESPONSABLE: Stamp,
  APPROVED_DIRECTEUR: Stamp,
  APPROVED_DG: Stamp,
  REJECTED: XCircle,
  UPDATED: FileText,
  ATTACHMENT_ADDED: Paperclip,
  ATTACHMENT_REMOVED: Paperclip,
  ESCALATED: ArrowUpRight,
  DELIVERED: PackageOpenIcon,
  AWAITING_FINAL_APPROVAL: CheckCircle2,
  FINAL_APPROVAL: CheckCircle2,
  MAGASINIER_ATTACHED: Package,
  SUPPLIER_CHOSEN: ShoppingCart,
  COMPLETED: PrinterCheck
};

const eventTypeTranslations: Record<EDBEventType, string> = {
  DRAFT_CREATED: "Brouillon créé",
  SUBMITTED: "Soumis",
  APPROVED_RESPONSABLE: "Approuvé par le Service",
  APPROVED_DIRECTEUR: "Approuvé par la Direction",
  APPROVED_DG: "Approuvé par la Direction Générale",
  REJECTED: "Rejeté",
  UPDATED: "Mis à jour",
  ATTACHMENT_ADDED: "Pièce jointe ajoutée",
  ATTACHMENT_REMOVED: "Pièce jointe supprimée",
  ESCALATED: "Escaladé",
  DELIVERED: "Livré",
  MAGASINIER_ATTACHED: "Facture rattaché par le Service d'Achat",
  AWAITING_FINAL_APPROVAL: "En attente d'approbation finale",
  FINAL_APPROVAL: "Approbation finale effectué",
  SUPPLIER_CHOSEN: "Fournisseur choisi",
  COMPLETED: "Traité"
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', { 
    month: 'numeric', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
};

export const EDBTimeline: React.FC<EDBTimelineProps> = ({ edb }) => {
  const sortedLogs = [...edb.auditLogs].sort((a, b) => 
    new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()
  );

  return (
    <div className="bg-background rounded-lg border p-4 mt-4">
      <h2 className="text-lg font-semibold mb-4">Événements</h2>
      <Separator className="my-2" />
      <ScrollArea className="h-[25rem]">
        <div className="relative">
          {sortedLogs.map((log, index) => {
            const Icon = eventTypeIcons[log.eventType];
            return (
              <div key={log.id} className="flex items-start space-x-2 mb-4">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10 relative">
                    <Icon className="h-4 w-4 text-primary-foreground" />
                  </div>
                  {index !== sortedLogs.length - 1 && (
                    <div className="absolute top-8 left-1/2 bottom-0 w-0.5 bg-primary -translate-x-1/2" />
                  )}
                </div>
                <div className="flex-1 border rounded-xl p-3 shadow">
                  <p className="font-medium">{eventTypeTranslations[log.eventType]}</p>
                  <p className="text-sm text-muted-foreground">Par: <b>{log.user.name}</b></p>
                  <p className="text-xs text-muted-foreground">Le: {formatDate(log.eventAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};