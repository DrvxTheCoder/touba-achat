import React from 'react';
import { User, Stamp, Package, ShoppingCart, CheckCircle2, Printer } from 'lucide-react';
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

const keyEvents = [
  'CREATION',
  'APPROVAL',
  'MAGASINIER',
  'SUPPLIER',
  'FINAL_APPROVAL',
  'COMPLETED'
] as const; 

type KeyEvent = typeof keyEvents[number];

const eventTypeToKeyEvent: Record<EDBEventType, KeyEvent> = {
  DRAFT_CREATED: 'CREATION',
  SUBMITTED: 'CREATION',
  APPROVED_RESPONSABLE: 'APPROVAL',
  APPROVED_DIRECTEUR: 'APPROVAL',
  APPROVED_DG: 'APPROVAL',
  REJECTED: 'APPROVAL',
  UPDATED: 'APPROVAL',
  ATTACHMENT_ADDED: 'APPROVAL',
  ATTACHMENT_REMOVED: 'APPROVAL',
  ESCALATED: 'APPROVAL',
  MAGASINIER_ATTACHED: 'MAGASINIER',
  SUPPLIER_CHOSEN: 'SUPPLIER',
  COMPLETED: 'COMPLETED'
};

const eventTypeIcons: Record<KeyEvent, React.ElementType> = {
  CREATION: User,
  APPROVAL: Stamp,
  MAGASINIER: Package,
  SUPPLIER: ShoppingCart,
  FINAL_APPROVAL: CheckCircle2,
  COMPLETED: Printer
};

const keyEventTranslations: Record<KeyEvent, string> = {
  CREATION: "Création",
  APPROVAL: "Approbation",
  MAGASINIER: "Traitement Service Achat",
  SUPPLIER: "Choix du Fournisseur",
  FINAL_APPROVAL: "Approbation Finale",
  COMPLETED: "Delivré"
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
        {sortedLogs.map((log) => {
          const keyEvent = eventTypeToKeyEvent[log.eventType];
          const Icon = eventTypeIcons[keyEvent];
          return (
            <div key={log.id} className="flex items-start space-x-4 mb-4 border rounded-xl p-3 shadow">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{keyEventTranslations[keyEvent]}</p>
                <p className="text-sm text-muted-foreground">Par: <b>{log.user.name}</b></p>
                <p className="text-xs text-muted-foreground">Le: {formatDate(log.eventAt)}</p>
              </div>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
};