import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define the status mapping
const statusMapping: Record<string, string[]> = {
  'Brouillon': ['DRAFT'],
  'Soumis': ['SUBMITTED'],
  'Validé': ['APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'IT_APPROVED', 'APPROVED_DG'],
  'Escaladé': ['ESCALATED'],
  'En attente': ['AWAITING_MAGASINIER', 'AWAITING_SUPPLIER_CHOICE', 'AWAITING_IT_APPROVAL', 'AWAITING_FINAL_APPROVAL'],
  'Facture Rattaché': ['MAGASINIER_ATTACHED'],
  'Fournisseur Choisi': ['SUPPLIER_CHOSEN'],
  'Rejeté': ['REJECTED'],
  'Complété': ['COMPLETED'],
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
    : displayStatus === 'Validé'
    ? 'outline'
    : displayStatus === 'Escaladé'
    ? 'outline'
    : displayStatus === 'Complété'
    ? 'default'
    : 'secondary';

  const textSizeClass = textSize === 'tiny' ? 'text-xs' : '';

  const badgeContent = (
    <Badge className={`m-1 ${textSizeClass} cursor-pointer`} variant={variant}>
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