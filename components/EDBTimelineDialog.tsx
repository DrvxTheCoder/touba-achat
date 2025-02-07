"use client"
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Stamp, Truck } from "lucide-react";
import { 
  CheckCircle2, 
  XCircle, 
  Upload, 
  User, 
  Package,
  ShoppingCart,
  AlertTriangle,
  Printer
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EDBStatus, EDBEventType } from '@/app/(utilisateur)/etats-de-besoin/data/types';

type EDBTimelineDialogProps = {
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
  DELIVERED: 'SUPPLIER',
  AWAITING_FINAL_APPROVAL: 'FINAL_APPROVAL',
  FINAL_APPROVAL: 'FINAL_APPROVAL',
  COMPLETED: 'COMPLETED'

};

const statusTranslations: Record<EDBEventType, string> = {
  DRAFT_CREATED: "Brouillon créé",
  SUBMITTED: "Soumis par l'employé",
  APPROVED_RESPONSABLE: "Approuvé par le Service",
  APPROVED_DIRECTEUR: "Approuvé par la Direction",
  APPROVED_DG: "Approuvé par la Direction Générale",
  REJECTED: "Rejeté",
  UPDATED: "Mis à jour",
  ATTACHMENT_ADDED: "Pièce jointe ajoutée",
  ATTACHMENT_REMOVED: "Pièce jointe supprimée",
  ESCALATED: "Escaladé",
  MAGASINIER_ATTACHED: "Pièce jointe par le Magasinier",
  SUPPLIER_CHOSEN: "Fournisseur choisi",
  DELIVERED: "Livré",
  AWAITING_FINAL_APPROVAL: "En attente de validation finale",
  FINAL_APPROVAL: "Validation finale effectué",
  COMPLETED: "Traité par le Service d'Achat"
};

const keyEventTranslations: Record<KeyEvent, string> = {
  CREATION: "Création",
  APPROVAL: "Approbation",
  MAGASINIER: "Traitement Service Achat",
  SUPPLIER: "Fournisseur",
  FINAL_APPROVAL: "Validation Finale",
  COMPLETED: "Traité"
};



type KeyEvent = typeof keyEvents[number];

const eventTypeIcons: Record<KeyEvent, React.ElementType> = {
  CREATION: User,
  APPROVAL: Stamp,
  MAGASINIER: Package,
  SUPPLIER: ShoppingCart,
  FINAL_APPROVAL: CheckCircle2,
  COMPLETED: Printer
};


type Event = {
  eventType: EDBEventType;
  status: EDBStatus;
  eventAt: string;
  user: { name: string; };
};

type EDBTimelineProps = {
  edb: {
    id: string;
    currentStatus: EDBStatus;
    events: Event[];
  };
};


const getEventStatus = (edb: EDBTimelineProps['edb'], keyEvent: KeyEvent) => {
  console.log(`Checking status for ${keyEvent}`);
  
  const relevantEvents = edb.events.filter(e => eventTypeToKeyEvent[e.eventType] === keyEvent);
  console.log(`Relevant events for ${keyEvent}:`, relevantEvents);
  
  if (relevantEvents.length === 0) {
    console.log(`No events found for ${keyEvent}, returning PENDING`);
    return 'PENDING';
  }

  const latestEvent = relevantEvents[relevantEvents.length - 1];
  console.log(`Latest event for ${keyEvent}:`, latestEvent);

  // Check if any later stage is completed
  const isLaterStageCompleted = keyEvents.slice(keyEvents.indexOf(keyEvent) + 1)
    .some(laterEvent => {
      const status = getEventStatus(edb, laterEvent as KeyEvent);
      console.log(`Status of later stage ${laterEvent}: ${status}`);
      return status === 'COMPLETED';
    });

  switch (keyEvent) {
    case 'CREATION':
      return isLaterStageCompleted || latestEvent.eventType === 'SUBMITTED' ? 'COMPLETED' : 'IN_PROGRESS';
    case 'APPROVAL':
      if (isLaterStageCompleted) return 'COMPLETED';
      if (['APPROVED_DG', 'APPROVED_DIRECTEUR'].includes(latestEvent.eventType)) return 'COMPLETED';
      if (latestEvent.eventType === 'REJECTED') return 'REJECTED';
      if (['APPROVED_RESPONSABLE', 'ESCALATED'].includes(latestEvent.eventType)) return 'IN_PROGRESS';
      return 'PENDING';
    case 'MAGASINIER':
      return isLaterStageCompleted || latestEvent.eventType === 'MAGASINIER_ATTACHED' ? 'COMPLETED' : 'IN_PROGRESS';
    case 'SUPPLIER':
      if (latestEvent.eventType === 'SUPPLIER_CHOSEN') return 'IN_PROGRESS';
      return isLaterStageCompleted || latestEvent.eventType === 'DELIVERED' ? 'COMPLETED' : 'PENDING';
    case 'FINAL_APPROVAL':
      return isLaterStageCompleted || latestEvent.eventType === 'FINAL_APPROVAL' ? 'COMPLETED' : 'IN_PROGRESS';
    case 'COMPLETED':
      return latestEvent.eventType === 'COMPLETED' ? 'COMPLETED' : 'PENDING';
    default:
      return 'PENDING';
  }
};
const getStatusDetails = (status: EDBStatus) => {
  switch (status) {
    case 'SUBMITTED':
      return 'Soumis'
    case 'ESCALATED':
      return 'Escaladé au DG';
    case 'APPROVED_RESPONSABLE':
      return 'Approuvé par le Service';
    case 'APPROVED_DIRECTEUR':
      return 'Approuvé par la Direction';
    case 'APPROVED_DG':
      return 'Approuvé par le DG';
    case 'MAGASINIER_ATTACHED':
      return 'Facture rattaché'
    case 'SUPPLIER_CHOSEN':
      return 'Fournisseur choisi'
    case 'IT_APPROVED':
      return 'Approuvé par le Service IT'
    case 'REJECTED':
      return 'Rejeté'
    default:
      return status;
  }
};

const EventNode: React.FC<{ edb: EDBTimelineProps['edb']; keyEvent: KeyEvent }> = ({ edb, keyEvent }) => {
  const Icon = eventTypeIcons[keyEvent];
  const status = getEventStatus(edb, keyEvent);
  
  const relevantEvents = edb.events.filter(e => eventTypeToKeyEvent[e.eventType as EDBEventType] === keyEvent);
  const latestEvent = relevantEvents[relevantEvents.length - 1];

  const isCurrentStep = status === 'IN_PROGRESS';
  const isRejected = status === 'REJECTED';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          {isCurrentStep && !isRejected && (
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 bg-cyan-600/60 animate-ping"></span>
          )}
          <div className={`relative flex-shrink-0 w-8 h-8 rounded-full 
            ${isRejected ? 'bg-destructive border-2 border-destructive' :
              status === 'COMPLETED' ? 'bg-primary' : 
              status === 'IN_PROGRESS' ? 'bg-cyan-600' : 'bg-muted-foreground/75 opacity-40'}
            flex items-center justify-center cursor-pointer`}>
            {isRejected ? <XCircle className="text-white" size={16} /> : <Icon className="text-white" size={16} />}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{keyEventTranslations[keyEvent]}</h4>
            <p className={`text-sm ${isRejected ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {status === 'COMPLETED' ? 'Terminé' : 
               status === 'IN_PROGRESS' ? 'En cours' : 
               status === 'REJECTED' ? 'Rejeté' : 'En attente'}
            </p>
          </div>
          {latestEvent && (
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <p className="text-xs font-medium">Statut:</p>
                <p className={`col-span-2 text-xs ${isRejected ? 'text-destructive font-semibold' : ''}`}>
                  {statusTranslations[latestEvent.eventType]}
                </p>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <p className="text-xs font-medium">Date:</p>
                <p className="col-span-2 text-xs">{new Date(latestEvent.eventAt).toLocaleString('fr-FR')}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <p className="text-xs font-medium">Utilisateur:</p>
                <p className="col-span-2 text-xs">{latestEvent.user.name}</p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const EDBTimeline: React.FC<EDBTimelineProps> = ({ edb }) => {
  return (
    <div className="p-4 rounded-lg border border-dashed">
      <div className="flex items-center space-x-2">
        {keyEvents.map((keyEvent, index) => (
          <React.Fragment key={keyEvent}>
            <EventNode edb={edb} keyEvent={keyEvent} />
            {index < keyEvents.length - 1 && (
              <div className={`flex-grow h-0.5 ${getEventStatus(edb, keyEvent) === 'COMPLETED' ? 'bg-primary' : 'bg-secondary'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const EDBTimelineDialog: React.FC<EDBTimelineDialogProps> = ({ edb }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setError(null); // Reset error when opening the dialog
    }
  };

  const prepareTimelineData = (): EDBTimelineProps['edb'] => {
    try {
      const events: Event[] = edb.auditLogs.map(log => ({
        eventType: log.eventType,
        status: edb.status,
        eventAt: log.eventAt,
        user: { name: log.user.name }
      }));
  
      return {
        id: edb.edbId,
        currentStatus: edb.status,
        events: events
      };
    } catch (err) {
      console.error("Error preparing timeline data:", err);
      setError("Une erreur s'est produite lors de la préparation des données de la chronologie.");
      return {
        id: edb.edbId,
        currentStatus: edb.status,
        events: []
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Truck className="h-3.5 w-3.5" />
          <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap hidden md:block">
            Traquer
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px]" onInteractOutside={(e) => {
          e.preventDefault();
        }}  >
        <DialogHeader>
          <DialogTitle className="border-b pb-4">{edb.edbId}</DialogTitle>
        </DialogHeader>
        {error ? (
          <div className="flex items-center justify-center p-4 text-destructive">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : (
          <EDBTimeline edb={prepareTimelineData()} />
        )}
      </DialogContent>
    </Dialog>
  );
};