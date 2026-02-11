'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { BottleType } from '@prisma/client';

interface BottleTypeConfig {
  id: number;
  type: BottleType;
  weight: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const BOTTLE_TYPES = [
  { value: 'B2_7', label: 'B2.7 (2.7kg)' },
  { value: 'B6', label: 'B6 (6kg)' },
  { value: 'B9', label: 'B9 (9kg)' },
  { value: 'B12_5', label: 'B12.5 (12.5kg)' },
  { value: 'B12_5K', label: 'B12.5K (12.5kg Kheuweul)' },
  { value: 'B38', label: 'B38 (38kg)' },
];

export default function BottleTypesSettings() {
  const router = useRouter();
  const [bottles, setBottles] = useState<BottleTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState<BottleTypeConfig | null>(null);
  const [formData, setFormData] = useState({
    type: '' as BottleType | '',
    weight: '',
    name: '',
  });

  const fetchBottles = async () => {
    try {
      const response = await fetch('/api/production/settings/bottle-types');
      if (response.ok) {
        const data = await response.json();
        setBottles(data);
      } else {
        toast.error('Erreur lors du chargement des types de bouteilles');
      }
    } catch (error) {
      console.error('Error fetching bottles:', error);
      toast.error('Erreur lors du chargement des types de bouteilles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBottles();
  }, []);

  const handleOpenDialog = (bottle?: BottleTypeConfig) => {
    if (bottle) {
      setSelectedBottle(bottle);
      setFormData({
        type: bottle.type,
        weight: bottle.weight.toString(),
        name: bottle.name,
      });
    } else {
      setSelectedBottle(null);
      setFormData({ type: '', weight: '', name: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBottle(null);
    setFormData({ type: '', weight: '', name: '' });
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.weight || !formData.name) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const payload = {
      type: formData.type,
      weight: parseFloat(formData.weight),
      name: formData.name,
    };

    try {
      const url = '/api/production/settings/bottle-types';
      const method = selectedBottle ? 'PUT' : 'POST';
      const body = selectedBottle
        ? { id: selectedBottle.id, ...payload }
        : payload;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          selectedBottle
            ? 'Type de bouteille modifié avec succès'
            : 'Type de bouteille créé avec succès'
        );
        fetchBottles();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving bottle:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleDelete = async () => {
    if (!selectedBottle) return;

    try {
      const response = await fetch(
        `/api/production/settings/bottle-types?id=${selectedBottle.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Type de bouteille supprimé avec succès');
        fetchBottles();
        setDeleteDialogOpen(false);
        setSelectedBottle(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error deleting bottle:', error);
      toast.error('Une erreur est survenue');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/production/settings/')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Types de Bouteilles</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gérez les configurations des types de bouteilles GPL
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un type
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total des types configurés
              </p>
              <p className="text-2xl font-bold">{bottles.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des types de bouteilles</CardTitle>
          <CardDescription>
            Configuration des poids pour chaque type de bouteille
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Poids (kg)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Aucun type de bouteille configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  bottles.map((bottle) => (
                    <TableRow key={bottle.id}>
                      <TableCell className="font-mono">{bottle.type}</TableCell>
                      <TableCell>{bottle.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {bottle.weight.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(bottle)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedBottle(bottle);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBottle ? 'Modifier' : 'Ajouter'} un type de bouteille
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du type de bouteille
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de bouteille</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as BottleType })
                }
                disabled={!!selectedBottle}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {BOTTLE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                placeholder="Ex: 2.7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom d&apos;affichage</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: 2.7kg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {selectedBottle ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le type de bouteille{' '}
              <strong>{selectedBottle?.name}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedBottle(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
