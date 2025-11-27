'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ApproSectionProps {
  stockInitial: number;
  butanier: number;
  recuperation: number;
  approSAR: number;
  onUpdate: (field: string, value: number) => void;
  disabled?: boolean;
}

export default function ApproSection({
  stockInitial,
  butanier,
  recuperation,
  approSAR,
  onUpdate,
  disabled
}: ApproSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Stock Initial Physique (tonnes)</Label>
          <Input
            type="number"
            step="0.01"
            value={stockInitial}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="butanier">Butanier (tonnes)</Label>
          <Input
            id="butanier"
            type="number"
            step="0.01"
            min="0"
            value={butanier}
            onChange={(e) => onUpdate('butanier', parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="recuperation">Récupération (tonnes)</Label>
          <Input
            id="recuperation"
            type="number"
            step="0.01"
            min="0"
            value={recuperation}
            onChange={(e) => onUpdate('recuperation', parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="approSAR">Appro SAR (tonnes)</Label>
          <Input
            id="approSAR"
            type="number"
            step="0.01"
            min="0"
            value={approSAR}
            onChange={(e) => onUpdate('approSAR', parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
