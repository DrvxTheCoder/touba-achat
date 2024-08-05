"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from './icons';

interface SupplierSelectionDialogProps {
    fileName: string;
    onConfirm: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    supplierName: string | 'Fournisseur' | null | undefined;
    isLoading: boolean;
    isChosen: boolean;
  }
  
  export const SupplierSelectionDialog: React.FC<SupplierSelectionDialogProps> = ({ 
    fileName, 
    onConfirm, 
    open, 
    onOpenChange,
    isLoading,
    supplierName,
    isChosen
  }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
          <DialogTitle>{isChosen ? "Fournisseur déjà sélectionné" : "Confirmer la sélection du fournisseur"}</DialogTitle>
          </DialogHeader>
          {isChosen ? (
          <p>Un fournisseur a déjà été sélectionné pour cet EDB.</p>
        ) : (
          <>
            <p className='text-sm'>{fileName} - <text className="text-muted-foreground text-xs">par {supplierName}</text></p>

            <Button onClick={onConfirm} disabled={isLoading}>
                {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirmer
            </Button>
          </>
        )}
        </DialogContent>
      </Dialog>
    );
  };