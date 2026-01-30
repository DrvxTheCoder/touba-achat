'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Building2, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ApproFieldConfig {
  id?: number;
  name: string;
  label: string;
  order: number;
  isActive: boolean;
  isRequired: boolean;
}

interface SortieFieldConfig {
  id?: number;
  name: string;
  label: string;
  order: number;
  isActive: boolean;
  isRequired: boolean;
}

interface ProductionCenter {
  id: number;
  name: string;
  address: string;
  numberOfLines: number;
  capacityPerLine: number;
  totalHourlyCapacity: number;
  chefProduction: {
    id: number;
    name: string;
    email: string;
  };
  approFieldConfigs: ApproFieldConfig[];
  sortieFieldConfigs: SortieFieldConfig[];
}

export default function ProductionCenterDetail() {
  const params = useParams();
  const router = useRouter();
  const centerId = params.id as string;

  const [center, setCenter] = useState<ProductionCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [capacityData, setCapacityData] = useState({
    numberOfLines: 2,
    capacityPerLine: 12.0,
  });

  const [approFields, setApproFields] = useState<ApproFieldConfig[]>([]);
  const [sortieFields, setSortieFields] = useState<SortieFieldConfig[]>([]);

  useEffect(() => {
    fetchCenterDetails();
  }, [centerId]);

  const fetchCenterDetails = async () => {
    try {
      const response = await fetch(`/api/production/settings/centers/${centerId}`);
      if (response.ok) {
        const data = await response.json();
        setCenter(data);

        // Set capacity data
        setCapacityData({
          numberOfLines: data.numberOfLines || 2,
          capacityPerLine: data.capacityPerLine || 12.0,
        });

        // Set field configs
        setApproFields(data.approFieldConfigs || []);
        setSortieFields(data.sortieFieldConfigs || []);
      } else {
        toast.error('Erreur lors du chargement du centre');
        router.push('/dashboard/production/settings/centers');
      }
    } catch (error) {
      console.error('Error fetching center:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCapacity = async () => {
    setSaving(true);
    try {
      const totalCapacity = capacityData.numberOfLines * capacityData.capacityPerLine;

      const response = await fetch(`/api/production/settings/centers/${centerId}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberOfLines: capacityData.numberOfLines,
          capacityPerLine: capacityData.capacityPerLine,
          totalHourlyCapacity: totalCapacity,
        }),
      });

      if (response.ok) {
        toast.success('Capacité mise à jour avec succès');
        fetchCenterDetails();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving capacity:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAddApproField = () => {
    const newField: ApproFieldConfig = {
      name: '',
      label: '',
      order: approFields.length + 1,
      isActive: true,
      isRequired: false,
    };
    setApproFields([...approFields, newField]);
  };

  const handleUpdateApproField = (index: number, updates: Partial<ApproFieldConfig>) => {
    const updated = [...approFields];
    updated[index] = { ...updated[index], ...updates };
    setApproFields(updated);
  };

  const handleDeleteApproField = (index: number) => {
    setApproFields(approFields.filter((_, i) => i !== index));
  };

  const handleAddSortieField = () => {
    const newField: SortieFieldConfig = {
      name: '',
      label: '',
      order: sortieFields.length + 1,
      isActive: true,
      isRequired: false,
    };
    setSortieFields([...sortieFields, newField]);
  };

  const handleUpdateSortieField = (index: number, updates: Partial<SortieFieldConfig>) => {
    const updated = [...sortieFields];
    updated[index] = { ...updated[index], ...updates };
    setSortieFields(updated);
  };

  const handleDeleteSortieField = (index: number) => {
    setSortieFields(sortieFields.filter((_, i) => i !== index));
  };

  const handleSaveFields = async () => {
    // Validate all fields have name and label
    const invalidAppro = approFields.some(f => !f.name || !f.label);
    const invalidSortie = sortieFields.some(f => !f.name || !f.label);

    if (invalidAppro || invalidSortie) {
      toast.error('Tous les champs doivent avoir un nom et un label');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/production/settings/centers/${centerId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approFields: approFields.map((f, idx) => ({ ...f, order: idx + 1 })),
          sortieFields: sortieFields.map((f, idx) => ({ ...f, order: idx + 1 })),
        }),
      });

      if (response.ok) {
        toast.success('Champs sauvegardés avec succès');
        fetchCenterDetails();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving fields:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!center) {
    return null;
  }

  const totalCapacity = capacityData.numberOfLines * capacityData.capacityPerLine;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/production/settings/centers')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{center.name}</h1>
          <p className="text-sm text-muted-foreground">{center.address}</p>
        </div>
      </div>

      <Tabs defaultValue="capacity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="capacity">Capacité</TabsTrigger>
          <TabsTrigger value="approvisionnement">Approvisionnement</TabsTrigger>
          <TabsTrigger value="sorties">Sorties</TabsTrigger>
        </TabsList>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Configuration de Capacité
              </CardTitle>
              <CardDescription>
                Configurez la capacité horaire de production de ce centre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfLines">Nombre de lignes</Label>
                  <Input
                    id="numberOfLines"
                    type="number"
                    min="1"
                    value={capacityData.numberOfLines}
                    onChange={(e) =>
                      setCapacityData({
                        ...capacityData,
                        numberOfLines: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacityPerLine">Capacité par ligne (T/h)</Label>
                  <Input
                    id="capacityPerLine"
                    type="number"
                    step="0.1"
                    min="0"
                    value={capacityData.capacityPerLine}
                    onChange={(e) =>
                      setCapacityData({
                        ...capacityData,
                        capacityPerLine: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Capacité Totale</p>
                <p className="text-3xl font-bold text-primary">
                  {totalCapacity.toFixed(1)} T/h
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {capacityData.numberOfLines} ligne(s) × {capacityData.capacityPerLine} T/h
                </p>
              </div>

              <Button onClick={handleSaveCapacity} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder la capacité
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvisionnement Tab */}
        <TabsContent value="approvisionnement" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Champs Approvisionnement</CardTitle>
                  <CardDescription>
                    Configurez les champs d&apos;entrée de stock pour ce centre
                  </CardDescription>
                </div>
                <Button onClick={handleAddApproField} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {approFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun champ configuré</p>
                  <p className="text-sm mt-2">Cliquez sur &quot;Ajouter&quot; pour créer un champ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Ordre</TableHead>
                        <TableHead>Nom (clé)</TableHead>
                        <TableHead>Label (affichage)</TableHead>
                        <TableHead className="w-[100px]">Actif</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approFields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={field.name}
                              onChange={(e) =>
                                handleUpdateApproField(index, { name: e.target.value })
                              }
                              placeholder="ex: butanier"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                handleUpdateApproField(index, { label: e.target.value })
                              }
                              placeholder="ex: Butanier"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={field.isActive}
                              onChange={(e) =>
                                handleUpdateApproField(index, { isActive: e.target.checked })
                              }
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteApproField(index)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Button onClick={handleSaveFields} disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder les champs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sorties Tab */}
        <TabsContent value="sorties" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Champs Sorties</CardTitle>
                  <CardDescription>
                    Configurez les champs de sortie de stock pour ce centre
                  </CardDescription>
                </div>
                <Button onClick={handleAddSortieField} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortieFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun champ configuré</p>
                  <p className="text-sm mt-2">Cliquez sur &quot;Ajouter&quot; pour créer un champ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Ordre</TableHead>
                        <TableHead>Nom (clé)</TableHead>
                        <TableHead>Label (affichage)</TableHead>
                        <TableHead className="w-[100px]">Actif</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortieFields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{index + 1}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={field.name}
                              onChange={(e) =>
                                handleUpdateSortieField(index, { name: e.target.value })
                              }
                              placeholder="ex: vrac_local"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                handleUpdateSortieField(index, { label: e.target.value })
                              }
                              placeholder="ex: Vrac Local"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={field.isActive}
                              onChange={(e) =>
                                handleUpdateSortieField(index, { isActive: e.target.checked })
                              }
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSortieField(index)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <Button onClick={handleSaveFields} disabled={saving} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder les champs
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
