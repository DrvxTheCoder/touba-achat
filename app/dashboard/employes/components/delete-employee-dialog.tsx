"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from "@/components/icons"

interface DeleteEmployeeDialogProps {
  employeeName: string
  onDelete: () => void
}

export function DeleteEmployeeDialog({ employeeName, onDelete }: DeleteEmployeeDialogProps) {
  const [deleteButtonLoading, setDeleteButtonLoading] = useState(false)

  const handleDelete = () => {
    setDeleteButtonLoading(true);
    onDelete();
    setDeleteButtonLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
      <div className="w-full text-destructive"><b>Supprimer</b></div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
        e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl">Supprimer l&apos;employé</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer l&apos;employé {employeeName} ? Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>Annuler</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteButtonLoading}>
            {deleteButtonLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <b>Supprimer</b>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}