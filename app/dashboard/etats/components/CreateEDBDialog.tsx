"use client"
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryType } from "@prisma/client"
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

interface CreateEDBDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

type Category = {
    id: number;
    name: string;
    type: CategoryType;
  }

export function CreateEDBDialog({ isOpen, onClose, onSubmit}: CreateEDBDialogProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null)

  const [descriptionItems, setDescriptionItems] = useState([{ designation: '', quantity: '' }]);

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (!response.ok) throw new Error('Erreur serveur')
      const fetchedCategories = await response.json()
      setCategories(fetchedCategories)
    } catch (err) {
      setError("Erreur lors de la récupération des catégories")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDescriptionItem = () => {
    setDescriptionItems([...descriptionItems, { designation: '', quantity: '' }]);
  };

  const handleRemoveDescriptionItem = (index: number) => {
    const newItems = descriptionItems.filter((_, i) => i !== index);
    setDescriptionItems(newItems);
  };

  const handleDescriptionItemChange = (index: number, field: 'designation' | 'quantity', value: string) => {
    const newItems = [...descriptionItems];
    newItems[index][field] = value;
    setDescriptionItems(newItems);
  };

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleSubmit = () => {
    const data = {
      title,
      category,
      reference,
      description: descriptionItems.map(item => `${item.designation} (Quantité: ${item.quantity})`)
    };
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Créer un nouvel État de Besoin</DialogTitle>
        </DialogHeader>
        <Card className='w-[22rem] lg:w-[50rem] mt-8'>
            <CardHeader className='border-b'>
              <CardTitle>Creér un EDB</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="title" className="text-foreground text-sm">
                  Titre
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="col-span-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <text className="text-foreground text-sm">
                  Description
                </text>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger className="max-w-36 text-xs">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()} className="text-sm">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <ScrollArea className="h-[200px] col-span-4 p-4 rounded border">
                  {descriptionItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2 p-1">
                      <Input
                        placeholder="Désignation"
                        value={item.designation}
                        onChange={(e) => handleDescriptionItemChange(index, 'designation', e.target.value)}
                        className="flex-grow"
                      />
                      <Input
                        placeholder="QTE"
                        type='number'
                        value={item.quantity}
                        onChange={(e) => handleDescriptionItemChange(index, 'quantity', e.target.value)}
                        className="w-20"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDescriptionItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddDescriptionItem}
                    className="mx-2"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Ajouter
                  </Button>
                </ScrollArea>
              </div>

              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="reference" className="text-sm">
                  Références (optionnel) :
                </label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
              <Button variant="outline">Annuler</Button>
              <Button variant="outline">Brouillon</Button>
              <Button variant="default" onClick={handleSubmit}>Créer</Button>
            </CardFooter>
          </Card>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}