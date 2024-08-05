import React from 'react';
import { Badge } from '@/components/ui/badge';

// Define the status mapping
const statusMapping: Record<string, string[]> = {
  'Brouillon': ['DRAFT'],
  'Soumis': ['SUBMITTED'],
  'Validé': ['APPROVED_RESPONSABLE', 'APPROVED_DIRECTEUR', 'IT_APPROVED', 'APPROVED_DG'],
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
}

// Define the component
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, textSize = 'default' }) => {
  const displayStatus = getDisplayStatus(status);

  const variant = displayStatus === 'Rejeté'
    ? 'destructive'
    : displayStatus === 'Validé'
    ? 'outline'
    : displayStatus === 'Complété'
    ? 'default'
    : 'secondary';

  const textSizeClass = textSize === 'tiny' ? 'text-xs' : '';

  return (
    <Badge className={`m-1 ${textSizeClass}`} variant={variant}>
      <small>{displayStatus}</small>
    </Badge>
  );
};

// // Usage example
// const selectedEDB = {
//   status: 'REJECTED' // Replace with the actual status
// };

// // Tiny text size example
// <StatusBadge status={selectedEDB.status} textSize="tiny" />;

// // Default text size example
// <StatusBadge status={selectedEDB.status} />;
