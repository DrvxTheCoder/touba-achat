import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stamp, Truck } from "lucide-react";
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

const eventTypeIcons = {
  CREATION: User,
  APPROVAL: Stamp,
  MAGASINIER: Package,
  SUPPLIER: ShoppingCart,
  IT_APPROVAL: AlertTriangle,
  DG_APPROVAL: CheckCircle2,
  COMPLETED: Printer
};

const statusTranslations = {
  CREATION: "Émission",
  APPROVAL: "Approbation Direction",
  MAGASINIER: "Traitement Magasinier",
  SUPPLIER: "Choix du Fournisseur",
  IT_APPROVAL: "Approbation IT",
  DG_APPROVAL: "Approbation Finale",
  COMPLETED: "Délivré"
};

const keyEvents = [
  'CREATION',
  'APPROVAL',
  'MAGASINIER',
  'SUPPLIER',
  'IT_APPROVAL',
  'DG_APPROVAL',
  'COMPLETED'
];

type EDBStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED_RESPONSABLE'
  | 'APPROVED_DIRECTEUR'
  | 'AWAITING_MAGASINIER'
  | 'MAGASINIER_ATTACHED'
  | 'AWAITING_SUPPLIER_CHOICE'
  | 'SUPPLIER_CHOSEN'
  | 'AWAITING_IT_APPROVAL'
  | 'IT_APPROVED'
  | 'AWAITING_FINAL_APPROVAL'
  | 'APPROVED_DG'
  | 'COMPLETED';

type Event = {
  eventType: keyof typeof eventTypeIcons;
  status: EDBStatus;
  eventAt: string;
  user: { name: string };
};

type EDBTimelineProps = {
  edb: {
    id: string;
    currentStatus: EDBStatus;
    events: Event[];
  };
};

// Updated dummy data
const dummyEDB: EDBTimelineProps['edb'] = {
  id: "EDB001",
  currentStatus: "AWAITING_SUPPLIER_CHOICE",
  events: [
    { eventType: "CREATION", status: "SUBMITTED", eventAt: "2024-07-01T10:30:00Z", user: { name: "John Doe" } },
    { eventType: "APPROVAL", status: "APPROVED_DIRECTEUR", eventAt: "2024-07-03T14:00:00Z", user: { name: "Bob Johnson" } },
    { eventType: "MAGASINIER", status: "MAGASINIER_ATTACHED", eventAt: "2024-07-05T11:30:00Z", user: { name: "Alice Brown" } },
    { eventType: "SUPPLIER", status: "AWAITING_SUPPLIER_CHOICE", eventAt: "2024-07-06T10:00:00Z", user: { name: "System" } },
  ]
};

const getEventStatus = (edb: EDBTimelineProps['edb'], eventType: keyof typeof eventTypeIcons) => {
  const event = edb.events.find(e => e.eventType === eventType);
  if (!event) {
    return 'PENDING';
  }
  if (eventType === 'CREATION' && event.status === 'SUBMITTED') {
    return 'COMPLETED';
  }
  if (eventType === 'APPROVAL' && ['APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR'].includes(event.status)) {
    return 'COMPLETED';
  }
  if (eventType === 'MAGASINIER' && event.status === 'MAGASINIER_ATTACHED') {
    return 'COMPLETED';
  }
  if (eventType === 'SUPPLIER' && event.status === 'SUPPLIER_CHOSEN') {
    return 'COMPLETED';
  }
  if (eventType === 'IT_APPROVAL' && event.status === 'IT_APPROVED') {
    return 'COMPLETED';
  }
  if (eventType === 'DG_APPROVAL' && event.status === 'APPROVED_DG') {
    return 'COMPLETED';
  }
  if (eventType === 'COMPLETED' && event.status === 'COMPLETED') {
    return 'COMPLETED';
  }
  return 'IN_PROGRESS';
};

const EventNode: React.FC<{ edb: EDBTimelineProps['edb']; eventType: keyof typeof eventTypeIcons }> = ({ edb, eventType }) => {
  const Icon = eventTypeIcons[eventType];
  const status = getEventStatus(edb, eventType);
  const event = edb.events.find(e => e.eventType === eventType);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full 
          ${status === 'COMPLETED' ? 'bg-primary' : 
            status === 'IN_PROGRESS' ? 'bg-secondary-foreground' : 'bg-muted opacity-40'}
          flex items-center justify-center cursor-pointer`}>
          <Icon className="text-white" size={16} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{statusTranslations[eventType]}</h4>
            <p className="text-sm text-muted-foreground">
              {status === 'COMPLETED' ? 'Terminé' : status === 'IN_PROGRESS' ? 'En cours' : 'En attente'}
            </p>
          </div>
          {event && (
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <p className="text-xs font-medium">Statut:</p>
                <p className="col-span-2 text-xs">{event.status}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <p className="text-xs font-medium">Date:</p>
                <p className="col-span-2 text-xs">{new Date(event.eventAt).toLocaleString('fr-FR')}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <p className="text-xs font-medium">Utilisateur:</p>
                <p className="col-span-2 text-xs">{event.user.name}</p>
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
        {keyEvents.map((eventType, index) => (
          <React.Fragment key={eventType}>
            <EventNode edb={edb} eventType={eventType as keyof typeof eventTypeIcons} />
            {index < keyEvents.length - 1 && (
              <div className={`flex-grow h-0.5 ${getEventStatus(edb, eventType as keyof typeof eventTypeIcons) === 'COMPLETED' ? 'bg-primary' : 'bg-secondary'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const EDBTimelineDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Truck className="h-3.5 w-3.5" />
          <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
            Traquer
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[825px]">
        <DialogHeader>
          <DialogTitle className="border-b pb-4">Traquer : #{dummyEDB.id}</DialogTitle>
        </DialogHeader>
        <EDBTimeline edb={dummyEDB} />
      </DialogContent>
    </Dialog>
  );
};