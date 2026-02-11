// app/dashboard/production/components/TimeInputSection.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/types/production';

interface TimeInputSectionProps {
  heureDebut: string;
  heureFin: string;
  tempsTotal: number;
  onUpdate: (field: 'heureDebut' | 'heureFin', value: string) => void;
  disabled?: boolean;
}

export default function TimeInputSection({
  heureDebut,
  heureFin,
  tempsTotal,
  onUpdate,
  disabled = false
}: TimeInputSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Temps de production</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Heure de début */}
        <div className="space-y-2">
          <Label htmlFor="heureDebut">
            Heure de début
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="heureDebut"
            type="time"
            value={heureDebut}
            onChange={(e) => onUpdate('heureDebut', e.target.value)}
            disabled={disabled}
            className="font-mono w-fit"
          />
        </div>

        {/* Heure de fin */}
        <div className="space-y-2">
          <Label htmlFor="heureFin">
            Heure de fin
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="heureFin"
            type="time"
            value={heureFin}
            onChange={(e) => onUpdate('heureFin', e.target.value)}
            disabled={disabled}
            className="font-mono w-fit"
          />
        </div>

        {/* Temps total calculé */}
        <div className="space-y-2">
          <Label>Temps total</Label>
          <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
            <span className="text-2xl font-bold text-primary">
              {formatDuration(tempsTotal)}
            </span>
            <span className="text-sm text-muted-foreground ml-2">
              ({tempsTotal} min)
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
