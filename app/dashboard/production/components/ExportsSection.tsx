'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ExportsSectionProps {
  ngabou: number;
  exports: number;
  divers: number;
  onUpdate: (field: string, value: number) => void;
  disabled?: boolean;
}

export default function ExportsSection({
  ngabou,
  exports,
  divers,
  onUpdate,
  disabled
}: ExportsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ngabou">Ngabou (tonnes)</Label>
          <Input
            id="ngabou"
            type="number"
            step="0.01"
            min="0"
            value={ngabou}
            onChange={(e) => onUpdate('ngabou', parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="exports">Exports (tonnes)</Label>
          <Input
            id="exports"
            type="number"
            step="0.01"
            min="0"
            value={exports}
            onChange={(e) => onUpdate('exports', parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="divers">Divers (tonnes)</Label>
          <Input
            id="divers"
            type="number"
            step="0.01"
            min="0"
            value={divers}
            onChange={(e) => onUpdate('divers', parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}
