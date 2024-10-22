// components/ValidationDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from '@/components/icons';
import { BadgeCheck } from 'lucide-react';

interface MarkAsDeliveredDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  edbId: string;
  isLoading: boolean;
}

export const MarkAsDeliveredDialog: React.FC<MarkAsDeliveredDialogProps> = ({ isOpen, onClose, onConfirm, edbId, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir poursuivre cette action ? <p className="text-sm mt-3">Nb: L&apos;état de besoin sera comme livré par le fournisseur.</p> 
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            Oui, continuer
            {isLoading ? (
             <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
            ) : (
            <BadgeCheck className="ml-2 h-4 w-4" />
            )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};