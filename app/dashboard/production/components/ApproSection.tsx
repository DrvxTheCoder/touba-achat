'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface FieldConfig {
  id: number;
  name: string;
  label: string;
  order: number;
  isActive: boolean;
  isRequired: boolean;
}

interface ApproSectionProps {
  stockInitial: number;
  dynamicValues: Record<string, number>;
  onUpdate: (field: string, value: number) => void;
  disabled?: boolean;
  productionCenterId?: number | null;
}

export default function ApproSection({
  stockInitial,
  dynamicValues,
  onUpdate,
  disabled,
  productionCenterId
}: ApproSectionProps) {
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productionCenterId) {
      setFields([]);
      setLoading(false);
      return;
    }

    const fetchFields = async () => {
      try {
        const response = await fetch(`/api/production/settings/centers/${productionCenterId}/fields`);
        if (response.ok) {
          const data = await response.json();
          setFields(data.appro || []);
        }
      } catch (error) {
        console.error('Error fetching appro fields:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [productionCenterId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Chargement des champs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {/* Stock Initial - Always shown */}
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

        {/* Dynamic fields from configuration */}
        {fields.length === 0 ? (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
              Aucun champ d&apos;approvisionnement configuré pour ce centre.
            </AlertDescription>
          </Alert>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="grid gap-2">
              <Label htmlFor={field.name}>
                {field.label} (tonnes)
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                min="0"
                value={dynamicValues[field.name] || 0}
                onChange={(e) => onUpdate(field.name, parseFloat(e.target.value) || 0)}
                disabled={disabled}
                required={field.isRequired}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
