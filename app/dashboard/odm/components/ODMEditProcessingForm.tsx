// components/ODMEditProcessingDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

interface ODMEditProcessingDialogProps {
  odm: any; // Replace with a proper ODM type
  isOpen: boolean;
  onClose: () => void;
  onProcessed: () => void;
}

interface ExpenseItem {
  id?: number;
  type: string;
  amount: number;
}

export const ODMEditProcessingDialog: React.FC<ODMEditProcessingDialogProps> = ({ 
  odm, 
  isOpen,
  onClose,
  onProcessed
}) => {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(odm.expenseItems || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCost, setTotalCost] = useState(odm.totalCost || 0);
  const [missionCostPerDay, setMissionCostPerDay] = useState(odm.missionCostPerDay);
  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  useEffect(() => {
    calculateTotal();
  }, [expenseItems, missionCostPerDay, days]);

  const calculateTotal = () => {
    const missionCost = days * missionCostPerDay;
    const expensesTotal = expenseItems.reduce((sum, item) => sum + item.amount, 0);
    setTotalCost(missionCost + expensesTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/odm/${odm.id}/edit-processing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseItems, totalCost, missionCostPerDay }),
      });
      if (!response.ok) throw new Error('Failed to update ODM processing');
      toast.success("Traitement de l'ODM mis à jour avec succès");
      onProcessed();
      onClose();
    } catch (error) {
      console.error('Error updating ODM processing:', error);
      toast.error("Erreur lors de la mise à jour du traitement de l'ODM");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { type: '', amount: 0 }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setExpenseItems(prevItems => 
      prevItems.map((item, i) => 
        i === index 
          ? { ...item, [field]: field === 'amount' ? Number(value) : value }
          : item
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modification ODM</DialogTitle>
          <DialogDescription>
            #{odm.odmId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="missionCostPerDay">Coût journalier de la mission</Label>
            <div className="flex flex-row gap-2">
              <Input
                id="missionCostPerDay"
                type="number"
                value={missionCostPerDay}
                onChange={(e) => setMissionCostPerDay(Number(e.target.value))}
                className="w-fit"
              />
              <text className='text-sm text-muted-foreground'>{`x Nombre de jours: ${days}`}</text>
            </div>
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {expenseItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-center mb-2">
                <Input
                  placeholder="Type de dépense"
                  value={item.type}
                  onChange={(e) => updateExpenseItem(index, 'type', e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Montant"
                  value={item.amount}
                  onChange={(e) => updateExpenseItem(index, 'amount', e.target.value)}
                  className="w-24"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => removeExpenseItem(index)}
                  className="p-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </ScrollArea>
          
          <Button type="button" onClick={addExpenseItem} variant="outline">
            Ajouter une dépense
          </Button>
          
          <div className="text-xl font-bold">
            Total: {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};