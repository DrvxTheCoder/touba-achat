// components/ValidationDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from '@/components/icons';
import { BadgeCheck, UserCheck } from 'lucide-react';

interface ValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  edbId: string;
  isLoading: boolean;
}

export const FinalApprovalDialog: React.FC<ValidationDialogProps> = ({ isOpen, onClose, onConfirm, edbId, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer l&apos;approbation final</DialogTitle>
          <DialogDescription>
          L&apos;EDB sera marqué comme pourvu par le Service d&apos;Achat. Poursuivre ? <p className="text-sm mt-3">Nb: Cette action est irreversible</p> 
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            Oui
            {isLoading ? (
             <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
            ) : (
            <UserCheck className="ml-2 h-4 w-4" />
            )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};