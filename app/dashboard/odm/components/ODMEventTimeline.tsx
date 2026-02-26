// components/ODMTimeline.tsx
import React from 'react';
import { User, Stamp, CheckCircle2, XCircle, FileText, Clock, Calculator, Printer, RotateCcw } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator"

type ODMStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AWAITING_DIRECTOR_APPROVAL'
  | 'AWAITING_DRH_APPROVAL'
  | 'AWAITING_RH_PROCESSING'
  | 'RH_PROCESSING'
  | 'AWAITING_DRH_VALIDATION'
  | 'AWAITING_DOG_APPROVAL'
  | 'READY_FOR_PRINT'
  | 'AWAITING_FINANCE_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED';

type ODMEventType =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AWAITING_DIRECTOR_APPROVAL'
  | 'AWAITING_DRH_APPROVAL'
  | 'AWAITING_RH_PROCESSING'
  | 'RH_PROCESSING'
  | 'AWAITING_DRH_VALIDATION'
  | 'AWAITING_DOG_APPROVAL'
  | 'READY_FOR_PRINT'
  | 'AWAITING_FINANCE_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'UPDATED'
  | 'RESTARTED';

type ODMTimelineProps = {
  odm: {
    id: string;
    odmId: string;
    status: ODMStatus;
    auditLogs: {
      id: number;
      eventType: ODMEventType;
      eventAt: string;
      user: {
        name: string;
      };
    }[];
  };
};

const eventTypeIcons: Record<ODMEventType, React.ElementType> = {
  DRAFT: User,
  SUBMITTED: FileText,
  AWAITING_DIRECTOR_APPROVAL: Clock,
  AWAITING_DRH_APPROVAL: Clock,
  AWAITING_RH_PROCESSING: Clock,
  RH_PROCESSING: Stamp,
  AWAITING_DRH_VALIDATION: Clock,
  AWAITING_DOG_APPROVAL: Clock,
  READY_FOR_PRINT: Printer,
  AWAITING_FINANCE_APPROVAL: Calculator,
  COMPLETED: Printer,
  REJECTED: XCircle,
  UPDATED: FileText,
  RESTARTED: RotateCcw,
};

const eventTypeTranslations: Record<ODMEventType, string> = {
  DRAFT: "Brouillon créé",
  SUBMITTED: "Soumis",
  AWAITING_DIRECTOR_APPROVAL: "En attente d'approbation du Directeur",
  AWAITING_DRH_APPROVAL: "Approuvé par le Directeur - En attente DRH",
  AWAITING_RH_PROCESSING: "Approuvé par la Direction",
  RH_PROCESSING: "Envoyé pour traitement RH",
  AWAITING_DRH_VALIDATION: "Traité par RH - En attente validation DRH",
  AWAITING_DOG_APPROVAL: "Validé par DRH - En attente approbation DOG",
  READY_FOR_PRINT: "Approuvé par DOG - Prêt pour impression",
  AWAITING_FINANCE_APPROVAL: "Traité par les Ressources Humaines",
  COMPLETED: "Imprimé",
  REJECTED: "Rejeté",
  UPDATED: "Mis à jour",
  RESTARTED: "Redémarré par DRH",
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

export const ODMTimeline: React.FC<ODMTimelineProps> = ({ odm }) => {
  const sortedLogs = [...odm.auditLogs].sort((a, b) => 
    new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()
  );

  return (
    <div className="bg-background rounded-lg border p-4">
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