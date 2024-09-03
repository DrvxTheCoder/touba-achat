// components/ValidationDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from '@/components/icons';
import { BadgeCheck } from 'lucide-react';

interface ValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  odmId: string;
  isLoading: boolean;
}

export const ODMValidationDialog: React.FC<ValidationDialogProps> = ({ isOpen, onClose, onConfirm, odmId, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer votre validation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir valider l&apos;ordre de mission ? 
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            Valider 
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