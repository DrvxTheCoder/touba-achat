"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from "@/components/icons"
import { toast } from "@/components/ui/use-toast"
import { Trash2 } from "lucide-react"

interface DeleteEmployeeDialogProps {
  employeeId: number;
  employeeName: string;
  onDelete: () => void;
}

export function DeleteEmployeeDialog({ employeeId, employeeName, onDelete }: DeleteEmployeeDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/employee/${employeeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      onDelete();
      setIsDialogOpen(false);
      toast({
        title: "Succès",
        description: "L'employé a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression de l'employé.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <div className="text-destructive w-full">Supprimer</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer <b className="text-destructive">{employeeName}</b> de la base ?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}