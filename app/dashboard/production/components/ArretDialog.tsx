// app/dashboard/production/[id]/ArretDialog.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Clock } from 'lucide-react';
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
    heureDebut: '',
    heureFin: '',
    remarque: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.heureDebut || !formData.heureFin) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const debut = new Date(formData.heureDebut);
    const fin = new Date(formData.heureFin);

    if (fin <= debut) {
      toast.error('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/production/${inventoryId}/arret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          heureDebut: debut.toISOString(),
          heureFin: fin.toISOString(),
          remarque: formData.remarque || undefined
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'ajout');
      }

      toast.success('Arrêt enregistré avec succès');
      setOpen(false);
      setFormData({ type: '', heureDebut: '', heureFin: '', remarque: '' });
      onArretAdded();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erreur lors de l\'ajout de l\'arrêt');
    } finally {
      setLoading(false);
    }
  };

  // Définir les valeurs par défaut pour les heures
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !formData.heureDebut) {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      setFormData(prev => ({
        ...prev,
        heureDebut: oneHourAgo.toISOString().slice(0, 16),
        heureFin: now.toISOString().slice(0, 16)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              Saisir les informations concernant l'arrêt de production
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type d'arrêt *</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="heureDebut">Heure de début *</Label>
                <Input
                  id="heureDebut"
                  type="datetime-local"
                  value={formData.heureDebut}
                  onChange={(e) =>
                    setFormData({ ...formData, heureDebut: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="heureFin">Heure de fin *</Label>
                <Input
                  id="heureFin"
                  type="datetime-local"
                  value={formData.heureFin}
                  onChange={(e) =>
                    setFormData({ ...formData, heureFin: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {formData.heureDebut && formData.heureFin && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Durée:{' '}
                  <span className="font-semibold">
                    {Math.round(
                      (new Date(formData.heureFin).getTime() -
                        new Date(formData.heureDebut).getTime()) /
                        60000
                    )}{' '}
                    minutes
                  </span>
                </span>
              </div>
            )}

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