// components/RejectionDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban } from 'lucide-react';

const rejectionReasons = [
  "Budget insuffisant",
  "Demande non justifiée",
  "Informations incomplètes",
  "Non conforme aux politiques de l'entreprise",
  "Autres"
];

interface RejectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  edbId: string;
  isLoading: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({ isOpen, onClose, onConfirm, edbId, isLoading }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Autres' ? customReason : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation de Rejet</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir rejeter cet état de besoins ?
          </DialogDescription>
        </DialogHeader>
        <Select onValueChange={setSelectedReason}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une raison" />
          </SelectTrigger>
          <SelectContent>
            {rejectionReasons.map((reason) => (
              <SelectItem key={reason} value={reason}>{reason}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedReason === 'Autres' && (
          <Textarea
            placeholder="Veuillez spécifier la raison du rejet"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedReason || (selectedReason === 'Autres' && !customReason.trim()) || isLoading}
            variant="destructive"
          >
            Oui, rejeter <Ban className="ml-1 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};