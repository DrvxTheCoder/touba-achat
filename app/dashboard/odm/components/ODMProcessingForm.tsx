// components/RHProcessingForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';

interface ODMProcessingFormProps {
  odmId: string;
  onProcessed: () => void;
  startDate: string;
  endDate: string;
  missionCostPerDay: number;
}

interface ExpenseItem {
  type: string;
  amount: number;
}

export const ODMProcessingForm: React.FC<ODMProcessingFormProps> = ({ 
  odmId, 
  onProcessed, 
  startDate, 
  endDate, 
  missionCostPerDay: initialMissionCostPerDay
}) => {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([{ type: '', amount: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [missionCostPerDay, setMissionCostPerDay] = useState(initialMissionCostPerDay);
  const start = new Date(startDate);
  const end = new Date(endDate);
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
      const response = await fetch(`/api/odm/${odmId}/processing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseItems, totalCost, missionCostPerDay }),
      });
      if (!response.ok) throw new Error('Failed to process ODM');
      toast.success("ODM traité avec succès");
      onProcessed();
    } catch (error) {
      console.error('Error processing ODM:', error);
      toast.error("Erreur lors du traitement de l'ODM");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traitement ODM</CardTitle>
        <CardDescription>Renseignez les informations additionnelles sur l&apos;ODM</CardDescription>
      </CardHeader>
      <CardContent>
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
          <ScrollArea className="w-full rounded-md h-28 p-3 border border-dashed">
            {expenseItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center p-1">
                <Input
                    placeholder="Type de dépense"
                    value={item.type}
                    onChange={(e) => {
                    const newItems = [...expenseItems];
                    newItems[index].type = e.target.value;
                    setExpenseItems(newItems);
                    }}
                />
                <Input
                    type="number"
                    placeholder="Montant"
                    value={item.amount}
                    onChange={(e) => {
                    const newItems = [...expenseItems];
                    newItems[index].amount = Number(e.target.value);
                    setExpenseItems(newItems);
                    }}
                    className="w-fit"
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => removeExpenseItem(index)}
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
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {/* {isSubmitting ? 'Traitement...' : 'Traiter l\'ODM'} */}
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <b>{'Traiter l\'ODM'}</b>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};