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
import { Plus, Pencil, Trash2, Droplet, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ReservoirType, CalculationMode } from '@prisma/client';

interface ReservoirConfig {
  id: number;
  name: string;
  type: ReservoirType;
  capacity: number;
  capacityTonnes: number | null;
  calculationMode: CalculationMode;
  productionCenter: {
    id: number;
    name: string;
  };
  _count: {
    reservoirs: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductionCenter {
  id: number;
  name: string;
}

const RESERVOIR_TYPES = [
  { value: 'SPHERE', label: 'Sphère', color: 'bg-blue-100 text-blue-800' },
  { value: 'CIGARE', label: 'Cigare', color: 'bg-green-100 text-green-800' },
  { value: 'AUTRE', label: 'Autre', color: 'bg-gray-100 text-gray-800' },
];

const CALCULATION_MODES = [
  { value: 'AUTOMATIC', label: 'Automatique', description: 'Calculs automatiques avec tous les champs de saisie', color: 'bg-purple-100 text-purple-800' },
  { value: 'MANUAL', label: 'Manuel', description: 'Saisie manuelle directe du poids liquide', color: 'bg-orange-100 text-orange-800' },
  { value: 'PERCENTAGE_BASED', label: 'Pourcentage', description: 'Calcul basé sur % réservoir × capacité × densité ambiante', color: 'bg-indigo-100 text-indigo-800' },
];

export default function ReservoirsSettings() {
  const router = useRouter();
  const [reservoirs, setReservoirs] = useState<ReservoirConfig[]>([]);
  const [centers, setCenters] = useState<ProductionCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReservoir, setSelectedReservoir] = useState<ReservoirConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '' as ReservoirType | '',
    capacity: '',
    capacityTonnes: '',
    calculationMode: 'AUTOMATIC' as CalculationMode,
    productionCenterId: '',
  });

  const fetchReservoirs = async () => {
    try {
      const response = await fetch('/api/production/settings/reservoirs');
      if (response.ok) {
        const data = await response.json();
        setReservoirs(data);
      } else {
        toast.error('Erreur lors du chargement des réservoirs');
      }
    } catch (error) {
      console.error('Error fetching reservoirs:', error);
      toast.error('Erreur lors du chargement des réservoirs');
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/production/settings/centers');
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  useEffect(() => {
    fetchReservoirs();
    fetchCenters();
  }, []);

  const handleOpenDialog = (reservoir?: ReservoirConfig) => {
    if (reservoir) {
      setSelectedReservoir(reservoir);
      setFormData({
        name: reservoir.name,
        type: reservoir.type,
        capacity: reservoir.capacity.toString(),
        capacityTonnes: reservoir.capacityTonnes?.toString() || '',
        calculationMode: reservoir.calculationMode,
        productionCenterId: reservoir.productionCenter.id.toString(),
      });
    } else {
      setSelectedReservoir(null);
      setFormData({ name: '', type: '', capacity: '', capacityTonnes: '', calculationMode: 'AUTOMATIC', productionCenterId: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedReservoir(null);
    setFormData({ name: '', type: '', capacity: '', capacityTonnes: '', calculationMode: 'AUTOMATIC', productionCenterId: '' });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type || !formData.capacity || !formData.capacityTonnes || !formData.productionCenterId) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const payload = {
      name: formData.name,
      type: formData.type as ReservoirType,
      capacity: parseFloat(formData.capacity),
      capacityTonnes: parseFloat(formData.capacityTonnes),
      calculationMode: formData.calculationMode,
      productionCenterId: parseInt(formData.productionCenterId),
    };

    try {
      const url = '/api/production/settings/reservoirs';
      const method = selectedReservoir ? 'PUT' : 'POST';
      const body = selectedReservoir
        ? { id: selectedReservoir.id, ...payload }
        : payload;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          selectedReservoir
            ? 'Réservoir modifié avec succès'
            : 'Réservoir créé avec succès'
        );
        fetchReservoirs();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving reservoir:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleDelete = async () => {
    if (!selectedReservoir) return;

    try {
      const response = await fetch(
        `/api/production/settings/reservoirs?id=${selectedReservoir.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Réservoir supprimé avec succès');
        fetchReservoirs();
        setDeleteDialogOpen(false);
        setSelectedReservoir(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error deleting reservoir:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const getTypeLabel = (type: ReservoirType) => {
    return RESERVOIR_TYPES.find(t => t.value === type)?.label || type;
  };

  const getTypeBadgeClass = (type: ReservoirType) => {
    return RESERVOIR_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800';
  };

  const getCalculationModeLabel = (mode: CalculationMode) => {
    return CALCULATION_MODES.find(m => m.value === mode)?.label || mode;
  };

  const getCalculationModeBadgeClass = (mode: CalculationMode) => {
    return CALCULATION_MODES.find(m => m.value === mode)?.color || 'bg-gray-100 text-gray-800';
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
            <h1 className="text-2xl font-bold">Réservoirs GPL</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gérez les configurations des réservoirs de stockage GPL
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un réservoir
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10">
              <Droplet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total des réservoirs configurés
              </p>
              <p className="text-2xl font-bold">{reservoirs.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des réservoirs</CardTitle>
          <CardDescription>
            Configuration des réservoirs de stockage GPL par centre
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden xl:table-cell">Mode de calcul</TableHead>
                  <TableHead className="hidden md:table-cell">Centre</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Capacité (m³)</TableHead>
                  <TableHead className="text-right">Capacité (T)</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Utilisations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservoirs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucun réservoir configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  reservoirs.map((reservoir) => (
                    <TableRow key={reservoir.id}>
                      <TableCell className="font-medium font-mono">{reservoir.name}</TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeClass(reservoir.type)}>
                          {getTypeLabel(reservoir.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge className={getCalculationModeBadgeClass(reservoir.calculationMode)}>
                          {getCalculationModeLabel(reservoir.calculationMode)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {reservoir.productionCenter.name}
                      </TableCell>
                      <TableCell className="text-right font-mono hidden lg:table-cell">
                        {reservoir.capacity.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {reservoir.capacityTonnes?.toFixed(3) || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Badge variant="secondary">{reservoir._count.reservoirs}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(reservoir)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReservoir(reservoir);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={reservoir._count.reservoirs > 0}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedReservoir ? 'Modifier' : 'Ajouter'} un réservoir
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du réservoir de stockage GPL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="center">Centre de production</Label>
              <Select
                value={formData.productionCenterId}
                onValueChange={(value) =>
                  setFormData({ ...formData, productionCenterId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un centre" />
                </SelectTrigger>
                <SelectContent>
                  {centers.map((center) => (
                    <SelectItem key={center.id} value={center.id.toString()}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du réservoir</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: D100, SO2, SO3, C1..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type de réservoir</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as ReservoirType })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {RESERVOIR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calculationMode">Mode de calcul</Label>
              <Select
                value={formData.calculationMode}
                onValueChange={(value) =>
                  setFormData({ ...formData, calculationMode: value as CalculationMode })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mode" />
                </SelectTrigger>
                <SelectContent>
                  {CALCULATION_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{mode.label}</span>
                        <span className="text-xs text-muted-foreground">{mode.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                <strong>Automatique:</strong> Saisie de tous les champs (hauteur, température, etc.) avec calcul automatique.
                <br />
                <strong>Manuel:</strong> Saisie directe du poids liquide uniquement.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacité (m³)</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  placeholder="Ex: 3304.491"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacityTonnes">Capacité (Tonnes) <span className="text-destructive">*</span></Label>
                <Input
                  id="capacityTonnes"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.capacityTonnes}
                  onChange={(e) =>
                    setFormData({ ...formData, capacityTonnes: e.target.value })
                  }
                  placeholder="Ex: 1664.745"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {selectedReservoir ? 'Modifier' : 'Créer'}
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
              Êtes-vous sûr de vouloir supprimer le réservoir{' '}
              <strong>{selectedReservoir?.name}</strong> ?
              <br />
              <br />
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedReservoir(null);
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
