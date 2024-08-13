// components/ValidationDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from '@/components/icons';
import { ArrowBigUpDash } from 'lucide-react';

interface EscalationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  edbId: string;
  isLoading: boolean;
}

export const EscalationDialog: React.FC<EscalationDialogProps> = ({ isOpen, onClose, onConfirm, edbId, isLoading }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir escalader cet état de besoin à la Direction Générale ? 
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={onConfirm} disabled={isLoading} className='bg-sky-500 hover:bg-sky-700 text-white'>
            Oui, escalader
            {isLoading ? (
             <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />
            ) : (
            <ArrowBigUpDash className="ml-2 h-4 w-4" />
            )}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};