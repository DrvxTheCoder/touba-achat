'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Truck } from 'lucide-react';
import { VehicleMovementData } from '@/lib/types/production';

interface VehiclesSectionProps {
  data: VehicleMovementData;
  onUpdate: (field: keyof VehicleMovementData, value: number | string) => void;
  disabled: boolean;
}

interface CategoryConfig {
  label: string;
  commField: keyof VehicleMovementData;
  livField: keyof VehicleMovementData;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: 'Véhicules Déchargés',
    commField: 'dechargesComm',
    livField: 'dechargesLiv',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  },
  {
    label: 'Véhicules Chargés',
    commField: 'chargesComm',
    livField: 'chargesLiv',
    color: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
  },
  {
    label: 'Véhicules Non Déchargés',
    commField: 'nonDechargesComm',
    livField: 'nonDechargesLiv',
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
  },
  {
    label: 'Véhicules Déchargés Non Chargés',
    commField: 'dechargesNonChargesComm',
    livField: 'dechargesNonChargesLiv',
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
  },
];

export default function VehiclesSection({ data, onUpdate, disabled }: VehiclesSectionProps) {
  const handleNumberChange = (field: keyof VehicleMovementData, raw: string) => {
    const parsed = parseInt(raw, 10);
    onUpdate(field, isNaN(parsed) ? 0 : Math.max(0, parsed));
  };

  return (
    <div className="space-y-6">
      {/* Legend */}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.commField}
            className={`rounded-lg border p-4 space-y-3 ${cat.color}`}
          >
            <p className="text-sm font-semibold">{cat.label}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={cat.commField} className="text-xs text-muted-foreground">
                  Commerciaux (COM)
                </Label>
                <Input
                  id={cat.commField}
                  type="number"
                  min={0}
                  value={data[cat.commField] as number}
                  onChange={(e) => handleNumberChange(cat.commField, e.target.value)}
                  disabled={disabled}
                  className="h-9 text-center bg-background"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={cat.livField} className="text-xs text-muted-foreground">
                  Livraison (LIV)
                </Label>
                <Input
                  id={cat.livField}
                  type="number"
                  min={0}
                  value={data[cat.livField] as number}
                  onChange={(e) => handleNumberChange(cat.livField, e.target.value)}
                  disabled={disabled}
                  className="h-9 text-center bg-background"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Observations */}
      <div className="space-y-1">
        <Label htmlFor="vm-observations" className="text-sm font-medium">
          Observations / NB
        </Label>
        <Textarea
          id="vm-observations"
          placeholder="Ex: Deux commerciaux sont déjà chargés sans bon..."
          value={data.observations}
          onChange={(e) => onUpdate('observations', e.target.value)}
          disabled={disabled}
          rows={3}
          className="resize-none"
        />
      </div>
    </div>
  );
}
