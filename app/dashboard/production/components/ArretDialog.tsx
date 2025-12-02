// app/dashboard/production/[id]/ArretDialog.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ARRET_TYPES } from '@/lib/types/production';
import { ArretType } from '@prisma/client';

interface ArretDialogProps {
  inventoryId: number;
  onArretAdded: () => void;
}

export default function ArretDialog({ inventoryId, onArretAdded }: ArretDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '' as ArretType | '',
    duree: '',
    remarque: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.duree) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const dureeMinutes = parseInt(formData.duree);

    if (isNaN(dureeMinutes) || dureeMinutes <= 0) {
      toast.error('La durée doit être un nombre positif');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/production/${inventoryId}/arret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          duree: dureeMinutes,
          remarque: formData.remarque || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'ajout');
      }

      toast.success('Arrêt enregistré avec succès');
      setOpen(false);
      setFormData({ type: '', duree: '', remarque: '' });
      onArretAdded();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de l\'ajout de l\'arrêt');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un arrêt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enregistrer un arrêt de production</DialogTitle>
            <DialogDescription>
              Saisir les informations concernant l&apos;arrêt de production
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type d&apos;arrêt *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as ArretType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ARRET_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duree">Durée de l&apos;arrêt (en minutes) *</Label>
              <Input
                id="duree"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 30"
                value={formData.duree}
                onChange={(e) =>
                  setFormData({ ...formData, duree: e.target.value })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Saisir le temps total d&apos;arrêt cumulé pour cette journée
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="remarque">Remarque</Label>
              <Textarea
                id="remarque"
                placeholder="Détails sur l'arrêt..."
                value={formData.remarque}
                onChange={(e) =>
                  setFormData({ ...formData, remarque: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}