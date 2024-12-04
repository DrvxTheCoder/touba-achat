// components/ODMEditProcessingDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ODMPersonCategory, ODM_CATEGORY_LABELS, ODM_DAILY_RATES } from '../utils/odm';
import { translateRole } from '@/app/utils/translate-roles';

interface ODMEditProcessingDialogProps {
  odm: any; // Replace with proper ODM type
  isOpen: boolean;
  onClose: () => void;
  onProcessed: () => void;
}

interface ExpenseItem {
  id?: number;
  type: string;
  amount: number;
}

interface AccompanyingPerson {
  name: string;
  category: ODMPersonCategory;
  costPerDay: number;
}

interface ODMPerson {
  name: string;
  category: ODMPersonCategory;
  costPerDay?: number;
}

interface ExpenseItem {
  type: string;
  customType?: string;
  amount: number;
}


const expenseTypes = ['Carburant', 'Péage', 'Frais d\'hôtel', 'Autres'];

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
  const [accompanyingPersons, setAccompanyingPersons] = useState<AccompanyingPerson[]>(
    odm.accompanyingPersons?.map((person: ODMPerson) => {
      const category = person.category as ODMPersonCategory;
      if (!Object.values(ODMPersonCategory).includes(category)) {
        // If category is invalid, default to FIELD_AGENT
        return {
          ...person,
          category: ODMPersonCategory.FIELD_AGENT,
          costPerDay: ODM_DAILY_RATES[ODMPersonCategory.FIELD_AGENT]
        };
      }
      return {
        ...person,
        category,
        costPerDay: person.costPerDay || ODM_DAILY_RATES[category]
      };
    }) || []
  );

  const start = new Date(odm.startDate);
  const end = new Date(odm.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  useEffect(() => {
    calculateTotal();
  }, [expenseItems, missionCostPerDay, accompanyingPersons, days]);

  const calculateTotal = () => {
    const mainMissionCost = days * missionCostPerDay;
    const accompanyingCost = accompanyingPersons.reduce((sum, person) => 
      sum + (person.costPerDay * days), 0
    );
    const expensesTotal = expenseItems.reduce((sum, item) => 
      sum + item.amount, 0
    );
    setTotalCost(mainMissionCost + accompanyingCost + expensesTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/odm/${odm.id}/edit-processing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          expenseItems, 
          totalCost, 
          missionCostPerDay,
          accompanyingPersons 
        }),
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

  const handlePersonCategoryChange = (personIndex: number, newCategory: ODMPersonCategory) => {
    setAccompanyingPersons(prevPersons => 
      prevPersons.map((person, index) => 
        index === personIndex ? {
          ...person,
          category: newCategory,
          costPerDay: person.costPerDay || ODM_DAILY_RATES[newCategory] // Keep existing cost if present
        } : person
      )
    );
  };

  const handleCostPerDayChange = (personIndex: number, newCostPerDay: number) => {
    setAccompanyingPersons(prevPersons =>
      prevPersons.map((person, index) =>
        index === personIndex ? {
          ...person,
          costPerDay: newCostPerDay
        } : person
      )
    );
  };

  const handleDialogClose = () => {
    // Reset form state to initial values
    setExpenseItems(odm.expenseItems || []);
    setTotalCost(odm.totalCost || 0);
    setMissionCostPerDay(odm.missionCostPerDay);
    setAccompanyingPersons(
      odm.accompanyingPersons?.map((person: ODMPerson) => {
        const category = person.category as ODMPersonCategory;
        if (!Object.values(ODMPersonCategory).includes(category)) {
          return {
            ...person,
            category: ODMPersonCategory.FIELD_AGENT,
            costPerDay: ODM_DAILY_RATES[ODMPersonCategory.FIELD_AGENT]
          };
        }
        return {
          ...person,
          category,
          costPerDay: person.costPerDay || ODM_DAILY_RATES[category]
        };
      }) || []
    );
    onClose();
  };

  const handleExpenseTypeChange = (value: string, index: number) => {
    const newItems = [...expenseItems];
    newItems[index].type = value;
    if (value !== 'Autres') {
      delete newItems[index].customType;
    }
    setExpenseItems(newItems);
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
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Modification ODM</DialogTitle>
          <DialogDescription>
            #{odm.odmId}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main mission cost */}
          <div className="gap-1 flex flex-col">
          <Label htmlFor="missionCostPerDay" className='font-bold text-lg'>Frais de mission</Label>
            <div className="flex flex-row items-center gap-2">
              <Input
                id="missionCostPerDay"
                type="number"
                value={missionCostPerDay}
                onChange={(e) => setMissionCostPerDay(Number(e.target.value))}
                className=" w-32 max-w-30 lg:w-fit"
              />
              <text className='text-sm text-muted-foreground'>
                {`x ${days} jour${days > 1 ? 's' : ''} = ${(days * missionCostPerDay).toLocaleString('fr-FR')} F CFA`}
              </text>
            </div>
          </div>

          {/* Accompanying persons section */}
          {accompanyingPersons.length > 0 && (
            <div className="space-y-2">
              <Label>Collaborateurs</Label>
              <ScrollArea className="w-full rounded-md max-h-40 p-3 border border-dashed">
                {accompanyingPersons.map((person, index) => (
                  <div key={index} className="flex flex-col gap-2 p-1">
                    <text className="w-fit">{person.name}</text>
                    <div className="flex flex-row items-center gap-2">
                      <Select
                        value={person.category}
                        onValueChange={(value: ODMPersonCategory) => 
                          handlePersonCategoryChange(index, value)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ODM_CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <text className="text-sm">{label}</text>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={person.costPerDay}
                        onChange={(e) => handleCostPerDayChange(index, Number(e.target.value))}
                        className="w-32"
                      />
                      <text className="text-xs text-muted-foreground">
                        x {days} = {(days * person.costPerDay).toLocaleString('fr-FR')} F CFA
                      </text>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <Separator />

          {/* Expense items section */}
          <div className="flex flex-row justify-between items-center">
            <Label className='font-bold'>Dépenses additionnelles</Label>
            <Button type="button" onClick={addExpenseItem} variant="outline">
              Ajouter une dépense
            </Button>
          </div>
          <ScrollArea className="w-full rounded-md h-44 p-3 border border-dashed">
            {expenseItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-center p-1">
                <Select
                  value={item.type}
                  onValueChange={(value) => handleExpenseTypeChange(value, index)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type de dépense" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {item.type === 'Autres' && (
                  <Input
                    placeholder="Précisez le type"
                    value={item.customType || ''}
                    onChange={(e) => {
                      const newItems = [...expenseItems];
                      newItems[index].customType = e.target.value;
                      setExpenseItems(newItems);
                    }}
                  />
                )}
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
          
          
          <div className="text-xl font-bold">
            Total: {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
          </div>
          
          <DialogFooter className="gap-2">
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