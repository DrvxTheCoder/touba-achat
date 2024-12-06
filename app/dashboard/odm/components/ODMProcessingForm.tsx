// components/RHProcessingForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { ODMPersonCategory, ODM_CATEGORY_LABELS, ODM_DAILY_RATES } from '../utils/odm';
import { Separator } from '@/components/ui/separator';

interface ODMProcessingFormProps {
  odmId: string;
  onProcessed: () => void;
  startDate: string;
  endDate: string;
  missionCostPerDay: number;
  accompanyingPersons?: Array<{
    name: string;
    category: ODMPersonCategory;
    costPerDay: number;
  }>;
}

interface ExpenseItem {
  type: string;
  customType?: string;
  amount: number;
}

interface AccompanyingPerson {
  name: string;
  category: ODMPersonCategory;
  costPerDay: number;
}

const expenseTypes = ['Carburant', 'Péage', 'Frais d\'hôtel', 'Autres'];

export const ODMProcessingForm: React.FC<ODMProcessingFormProps> = ({ 
  odmId, 
  onProcessed, 
  startDate, 
  endDate, 
  missionCostPerDay: initialMissionCostPerDay,
  accompanyingPersons: initialAccompanyingPersons = []
}) => {
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([{ type: '', amount: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [missionCostPerDay, setMissionCostPerDay] = useState(initialMissionCostPerDay);
  const [accompanyingPersons, setAccompanyingPersons] = useState<AccompanyingPerson[]>(
    initialAccompanyingPersons.map(person => ({
      ...person,
      costPerDay: ODM_DAILY_RATES[person.category]
    }))
  );

  const start = new Date(startDate);
  const end = new Date(endDate);
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
      const processedExpenseItems = expenseItems.map(item => ({
        type: item.type === 'Autres' ? item.customType : item.type,
        amount: item.amount
      }));
      
      const response = await fetch(`/api/odm/${odmId}/processing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          expenseItems: processedExpenseItems, 
          totalCost, 
          missionCostPerDay,
          accompanyingPersons
        }),
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

  const handlePersonCategoryChange = (personIndex: number, newCategory: ODMPersonCategory) => {
    const newPersons = [...accompanyingPersons];
    newPersons[personIndex] = {
      ...newPersons[personIndex],
      category: newCategory,
      costPerDay: ODM_DAILY_RATES[newCategory]
    };
    setAccompanyingPersons(newPersons);
  };

  const handleCostPerDayChange = (personIndex: number, newCostPerDay: number) => {
    const newPersons = [...accompanyingPersons];
    newPersons[personIndex] = {
      ...newPersons[personIndex],
      costPerDay: newCostPerDay
    };
    setAccompanyingPersons(newPersons);
  };

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, { type: '', amount: 0 }]);
  };

  const removeExpenseItem = (index: number) => {
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
  };

  const handleExpenseTypeChange = (value: string, index: number) => {
    const newItems = [...expenseItems];
    newItems[index].type = value;
    if (value !== 'Autres') {
      delete newItems[index].customType;
    }
    setExpenseItems(newItems);
  };

  return (
<Card>
      <CardHeader className='border-b mb-3'>
        <CardTitle>Traitement ODM</CardTitle>
        <CardDescription>Renseignez les informations additionnelles sur l&apos;ODM</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main mission cost */}
          <div className="gap-1 flex flex-col">
            <Label htmlFor="missionCostPerDay" className='font-bold text-lg'>Frais de mission</Label>
            <div className="flex flex-row gap-2 items-center">
              <Input
                id="missionCostPerDay"
                required
                type="number"
                value={missionCostPerDay}
                onChange={(e) => setMissionCostPerDay(Number(e.target.value))}
                className="w-fit"
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
                  <div key={index} className="flex flex-row gap-2 items-center p-1">
                    <text className="min-w-[150px]">{person.name}</text>
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
                    <text className="text-sm text-muted-foreground">
                      x {days} = {(days * person.costPerDay).toLocaleString('fr-FR')} F CFA
                    </text>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          <Separator className="my-8" />

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
                  required
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
                    required
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
                  required
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


          
          {/* Total cost display */}
          <div className="text-xl font-bold">
            Total: {totalCost.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
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