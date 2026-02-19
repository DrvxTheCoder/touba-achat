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
import { Plus, Pencil, Trash2, Building, ArrowLeft, User, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface ChefUser {
  id: number;
  name: string;
  email: string;
}

interface ProductionCenter {
  id: number;
  name: string;
  address: string;
  chefProduction: ChefUser; // backward compatibility - first chef
  chefProductions?: ChefUser[]; // all chefs
  reservoirs: Array<{
    id: number;
    name: string;
    type: string;
    capacity: number;
  }>;
  _count: {
    inventories: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export default function ProductionCentersSettings() {
  const router = useRouter();
  const [centers, setCenters] = useState<ProductionCenter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<ProductionCenter | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    chefProductionIds: [] as string[],
  });

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/production/settings/centers');
      if (response.ok) {
        const data = await response.json();
        setCenters(data);
      } else {
        toast.error('Erreur lors du chargement des centres');
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
      toast.error('Erreur lors du chargement des centres');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users with production access
      const response = await fetch('/api/users?access=CREATE_PRODUCTION_INVENTORY');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchCenters();
    fetchUsers();
  }, []);

  const handleOpenDialog = (center?: ProductionCenter) => {
    if (center) {
      setSelectedCenter(center);
      // Use chefProductions array if available, fallback to chefProduction for backward compat
      const chefIds = center.chefProductions && center.chefProductions.length > 0
        ? center.chefProductions.map(chef => chef.id.toString())
        : center.chefProduction ? [center.chefProduction.id.toString()] : [];
      setFormData({
        name: center.name,
        address: center.address,
        chefProductionIds: chefIds,
      });
    } else {
      setSelectedCenter(null);
      setFormData({ name: '', address: '', chefProductionIds: [] });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCenter(null);
    setFormData({ name: '', address: '', chefProductionIds: [] });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || formData.chefProductionIds.length === 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const payload = {
      name: formData.name,
      address: formData.address,
      chefProductionIds: formData.chefProductionIds.map(id => parseInt(id)),
    };

    try {
      const url = '/api/production/settings/centers';
      const method = selectedCenter ? 'PUT' : 'POST';
      const body = selectedCenter
        ? { id: selectedCenter.id, ...payload }
        : payload;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(
          selectedCenter
            ? 'Centre modifié avec succès'
            : 'Centre créé avec succès'
        );
        fetchCenters();
        handleCloseDialog();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error saving center:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleDelete = async () => {
    if (!selectedCenter) return;

    try {
      const response = await fetch(
        `/api/production/settings/centers?id=${selectedCenter.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Centre supprimé avec succès');
        fetchCenters();
        setDeleteDialogOpen(false);
        setSelectedCenter(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error deleting center:', error);
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
              onClick={() => router.push('/dashboard/production')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Centres de Production</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gérez les centres de production GPL et leurs chefs
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un centre
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-primary/10">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total des centres
              </p>
              <p className="text-2xl font-bold">{centers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des centres de production</CardTitle>
          <CardDescription>
            Centres GPL avec leurs chefs de production et réservoirs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden md:table-cell">Adresse</TableHead>
                  <TableHead>Chefs de production</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Réservoirs</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Inventaires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Aucun centre de production configuré
                    </TableCell>
                  </TableRow>
                ) : (
                  centers.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell className="font-medium">{center.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {center.address}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {(center.chefProductions && center.chefProductions.length > 0
                            ? center.chefProductions
                            : center.chefProduction ? [center.chefProduction] : []
                          ).map((chef) => (
                            <div key={chef.id} className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{chef.name}</span>
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  {chef.email}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Badge variant="outline">{center.reservoirs.length}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Badge variant="secondary">{center._count.inventories}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/production/settings/centers/${center.id}`)}
                            title="Configurer le centre"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(center)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCenter(center);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={center._count.inventories > 0}
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
              {selectedCenter ? 'Modifier' : 'Ajouter'} un centre de production
            </DialogTitle>
            <DialogDescription>
              Configurez les informations du centre de production GPL
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du centre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Centre GPL Touba"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Ex: Touba, Sénégal"
              />
            </div>
            <div className="space-y-2">
              <Label>Chefs de production</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun utilisateur disponible</p>
                ) : (
                  users.map((user) => {
                    const isSelected = formData.chefProductionIds.includes(user.id.toString());
                    return (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          const userId = user.id.toString();
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              chefProductionIds: formData.chefProductionIds.filter(id => id !== userId),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              chefProductionIds: [...formData.chefProductionIds, userId],
                            });
                          }
                        }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-input'
                        }`}>
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-3 h-3 text-primary-foreground"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {formData.chefProductionIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formData.chefProductionIds.length} chef(s) sélectionné(s)
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Seuls les utilisateurs avec l&apos;accès CREATE_PRODUCTION_INVENTORY sont listés
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {selectedCenter ? 'Modifier' : 'Créer'}
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
              Êtes-vous sûr de vouloir supprimer le centre{' '}
              <strong>{selectedCenter?.name}</strong> ?
              <br />
              <br />
              Cette action est irréversible et supprimera également tous les
              réservoirs associés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedCenter(null);
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
