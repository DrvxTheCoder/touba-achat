import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define the status mapping
const statusMapping: Record<string, string[]> = {
  'Brouillon': ['DRAFT'],
  'Soumis': ['SUBMITTED'],
  'Converti':['CONVERTED'],
  'Approuvé': ['APPROVED_DIRECTEUR', 'IT_APPROVED', 'APPROVED_DG', 'AWAITING_DIRECTOR_APPROVAL'],
  'Approuvé DAF': ['APPROVED_DAF'],
  'Escaladé': ['ESCALATED'],
  'En cours RH': ['RH_PROCESSING'],
  'Att. DRH': ['AWAITING_DRH_APPROVAL', 'AWAITING_RH_PROCESSING'],
  'Att. Validation DRH': ['AWAITING_DRH_VALIDATION'],
  'Att. DOG': ['AWAITING_DOG_APPROVAL'],
  'Prêt à imprimer': ['READY_FOR_PRINT'],
  'En attente': ['APPROVED_RESPONSABLE', 'AWAITING_MAGASINIER', 'AWAITING_SUPPLIER_CHOICE', 'AWAITING_IT_APPROVAL', 'AWAITING_FINAL_APPROVAL'],
  'Facture Rattaché': ['MAGASINIER_ATTACHED'],
  'Fournisseur Choisi': ['SUPPLIER_CHOSEN'],
  'Livré': ['DELIVERED'],
  'Livré*': ['PARTIALLY_DELIVERED'],
  'Décaissé': ['PRINTED'],
  'Validé': ['FINAL_APPROVAL'],
  'Rejeté': ['REJECTED'],
  'Traité': ['AWAITING_FINANCE_APPROVAL'],
  'Imprimé': ['COMPLETED'],
};

// Function to get the display status based on internal status
const getDisplayStatus = (internalStatus: string): string => {
  for (const [displayStatus, internalStatuses] of Object.entries(statusMapping)) {
    if (internalStatuses.includes(internalStatus)) {
      return displayStatus;
    }
  }
  return 'Unknown'; // Return 'Unknown' if no matching status is found
};

// Define the component props
interface StatusBadgeProps {
  status: string;
  textSize?: 'tiny' | 'default';
  rejectionReason?: string;
}

// Define the component
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, textSize = 'default', rejectionReason }) => {
  const displayStatus = getDisplayStatus(status);

  const variant = displayStatus === 'Rejeté'
    ? 'destructive'
    : displayStatus === 'Approuvé'
    ? 'outline'
    : displayStatus === 'Approuvé DAF'
    ? 'default'
    : displayStatus === 'Escaladé'
    ? 'outline'
    : displayStatus === 'Traité'
    ? 'default'
    : displayStatus === 'Imprimé'
    ? 'default'
    : displayStatus === 'Validé'
    ? 'default'
    : displayStatus === 'Décaissé'
    ? 'default'
    : displayStatus === 'Livré'
    ? 'default'
    : displayStatus === 'Prêt à imprimer'
    ? 'default'
    : displayStatus === 'En cours RH'
    ? 'secondary'
    : displayStatus === 'Att. DRH'
    ? 'secondary'
    : displayStatus === 'Att. Validation DRH'
    ? 'secondary'
    : displayStatus === 'Att. DOG'
    ? 'outline'
    : 'secondary';

  const textSizeClass = textSize === 'tiny' ? 'text-xs' : '';

  const badgeContent = (
    <Badge className={`${textSizeClass} text-[0.6rem] md:text-xs w-fit text-nowrap`} variant={variant}>
      <small>{displayStatus}</small>
    </Badge>
  );

  if (displayStatus === 'Rejeté' && rejectionReason) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <span>{badgeContent}</span>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h5 className="font-medium  leading-none">Raison du rejet: </h5>
            <p className="text-sm text-muted-foreground">{rejectionReason}</p>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return badgeContent;
};