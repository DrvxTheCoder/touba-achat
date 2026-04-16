'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BOTTLE_TYPES, BOTTLE_WEIGHTS, calculateTonnage } from '@/lib/types/production';
import { BottleType } from '@prisma/client';

interface BottlesSectionProps {
  bottles: any[];
  onUpdate: (bottles: any[]) => void;
  disabled?: boolean;
  shift?: 'JOUR' | 'NUIT';
}

export default function BottlesSection({
  bottles,
  onUpdate,
  disabled,
  shift = 'JOUR'
}: BottlesSectionProps) {
  const bottleTypes = Object.entries(BOTTLE_TYPES);

  // Filter bottles for this shift only
  const shiftBottles = bottles.filter(b => (b.shift || 'JOUR') === shift);
  // Bottles from the other shift (preserved during updates)
  const otherShiftBottles = bottles.filter(b => (b.shift || 'JOUR') !== shift);

  const updateBottle = (type: BottleType, quantity: number) => {
    const newShiftBottles = [...shiftBottles];
    const existingIndex = newShiftBottles.findIndex(b => b.type === type);

    if (quantity === 0) {
      if (existingIndex >= 0) {
        newShiftBottles.splice(existingIndex, 1);
      }
    } else {
      if (existingIndex >= 0) {
        newShiftBottles[existingIndex] = { type, quantity, shift };
      } else {
        newShiftBottles.push({ type, quantity, shift });
      }
    }

    // Merge back with other shift bottles
    onUpdate([...otherShiftBottles, ...newShiftBottles]);
  };

  const getBottleData = (type: BottleType) => {
    return shiftBottles.find(b => b.type === type) || { quantity: 0 };
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Entrez la quantité de bouteilles produites{shift === 'NUIT' ? ' (quart de nuit)' : ''}. Le tonnage sera calculé automatiquement.
      </div>
      {bottleTypes.map(([type, label]) => {
        const data = getBottleData(type as BottleType);
        const quantity = data.quantity || 0;
        const tonnage = calculateTonnage(type as BottleType, quantity);
        const weight = BOTTLE_WEIGHTS[type as BottleType];

        return (
          <div key={type} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">{label}</h4>
              <span className="text-xs text-muted-foreground">{weight}kg par bouteille</span>
            </div>
            <div className="grid grid-cols-2 gap-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor={`bottle-${shift}-${type}`}>Quantité</Label>
                <Input
                  id={`bottle-${shift}-${type}`}
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => updateBottle(type as BottleType, parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label>Tonnage calculé</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center text-sm font-medium">
                  {tonnage.toFixed(3)} tonnes
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
