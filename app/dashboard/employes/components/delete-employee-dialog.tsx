"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from "@/components/icons"
import { toast } from "@/components/ui/use-toast"
import { Trash2, RefreshCw } from "lucide-react"

interface ToggleEmployeeStatusDialogProps {
  employeeId: number;
  employeeName: string;
  isActive: boolean;
  onStatusChange: () => void;
}

export function ToggleEmployeeStatusDialog({ employeeId, employeeName, isActive, onStatusChange }: ToggleEmployeeStatusDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleStatus = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/employee/${employeeId}/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isActive ? 'deactivate' : 'reactivate'} employee`);
      }

      onStatusChange();
      setIsDialogOpen(false);
      toast({
        title: "Succès",
        description: `Le compte de l'employé a été ${isActive ? 'désactivé' : 'réactivé'} avec succès.`,
      });
    } catch (error) {
      console.error('Error toggling employee status:', error);
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite lors de la ${isActive ? 'désactivation' : 'réactivation'} du compte de l'employé.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const actionText = isActive ? 'Désactiver' : 'Réactiver';
  const actionIcon = isActive ? <Trash2 className="w-4 h-4 ml-11 md:ml-10" /> : <RefreshCw className="w-4 h-4 ml-11 md:ml-10" />;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className={`w-full flex items-center ${isActive ? 'text-destructive' : 'text-primary'}`}>
          {actionText} ce compte
          {actionIcon}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer l&apos;action</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir {isActive ? 'désactiver' : 'réactiver'} le compte de <b className={isActive ? "text-destructive" : "text-primary"}>{employeeName}</b> ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
          <Button 
            variant={isActive ? "destructive" : "default"} 
            onClick={handleToggleStatus} 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                {isActive ? 'Désactivation...' : 'Réactivation...'}
              </>
            ) : (
              <text className="text-white">
                {actionText}
              </text>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}