// components/odm/ODMFinanceApprovalDialog.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface ODMFinanceApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  onReject: (reason: string) => void;
  odmId: string;
  totalAmount: number;
  isLoading: boolean;
}

export function ODMFinanceApprovalDialog({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  odmId,
  totalAmount,
  isLoading
}: ODMFinanceApprovalDialogProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);

  const handleReject = () => {
    if (!showRejectReason) {
      setShowRejectReason(true);
      return;
    }
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setRejectReason("");
      setShowRejectReason(false);
    }
  };

  const handleClose = () => {
    setRejectReason("");
    setShowRejectReason(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Validation - #{odmId}</DialogTitle>
          <DialogDescription>
            Confirmez-vous la validation de l&apos;ODM  ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-between items-center text-lg">
            <span className="font-bold">Montant Total:</span>
            <span className="font-bold">
              {totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
            </span>
          </div>
          <Separator className="my-4" />
          {showRejectReason ? (
            <div className="space-y-4">
              <Textarea
                placeholder="Motif du rejet..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              En validant, vous confirmez l&apos;approbation du budget pour cette mission.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {showRejectReason ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRejectReason(false)}
              >
                Retour
              </Button>
              <Button
                type="button" 
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || isLoading}
              >
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Confirmer le rejet
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleReject}
                disabled={isLoading}
              >
                Rejeter
              </Button>
              <Button
                type="submit"
                onClick={() => onConfirm()}
                disabled={isLoading}
              >
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Valider
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}