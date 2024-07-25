"use client"
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryType } from "@prisma/client"
import { Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CategoriesDialog } from '../components/categories-dialog';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define the Zod schema
const edbSchema = z.object({
  title: z.string().min(1, "Ce champ est requis"),
  category: z.string().min(1, "Ce champ est requis"),
  reference: z.string().optional(),
  items: z.array(z.object({
    designation: z.string().min(1, "Ce champ est requis"),
    quantity: z.string().min(1, "Requis").regex(/^\d+$/, "La quantité doit être un nombre")
  })).min(1, "Au moins un élément est requis")
});

type Category = {
  id: number;
  name: string;
  type: CategoryType;
}

type EdbFormValues = z.infer<typeof edbSchema>;

const CreateEDBPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EdbFormValues>({
    resolver: zodResolver(edbSchema),
    defaultValues: {
      title: '',
      category: '',
      reference: '',
      items: [{ designation: '', quantity: '' }]
    }
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Erreur serveur');
      const fetchedCategories = await response.json();
      setCategories(fetchedCategories);
    } catch (err) {
      setError("Erreur lors de la récupération des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: EdbFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/edb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          items: data.items.map(item => ({
            designation: item.designation,
            quantity: parseInt(item.quantity, 10)
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create EDB');
      }

      const result = await response.json();
      
      toast({
        title: "EDB créé avec succès",
        description: `L'EDB ${result.edbId} a été créé.`,
      });

      router.push('/dashboard/etats');
    } catch (err) {
      setError('Une erreur est survenue lors de la création de l\'EDB');
      toast({
        title: "Erreur",
        description: "Impossible de créer l'EDB. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-lg md:text-3xl font-bold tracking-tight">États de Besoins - Nouveau</h2>
        </div>

        <div className="flex items-center justify-center">
        <Card className='w-[22rem] lg:w-[50rem] mt-8'>
          <CardHeader className='border-b'>
            <CardTitle>Créer un EDB</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
            <Form {...form}>
              
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel>Items</FormLabel>
                  <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                    {form.watch('items').map((item, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2 p-1">
                        <FormField
                          control={form.control}
                          name={`items.${index}.designation`}
                          render={({ field }) => (
                            <FormItem className="flex-grow">
                              <FormControl>
                                <Input {...field} placeholder="Désignation" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="w-24">
                              <FormControl>
                                <Input {...field} placeholder="QTE" type="number" />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                        {form.watch('items').length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const currentItems = form.getValues('items');
                              form.setValue('items', currentItems.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentItems = form.getValues('items');
                        form.setValue('items', [...currentItems, { designation: '', quantity: '' }]);
                      }}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Ajouter
                    </Button>
                  </ScrollArea>
                </FormItem>
                
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Références (optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <CardFooter className="flex justify-between gap-2 pt-4 px-0">
                  <Button variant="outline" type="button" disabled={isLoading}>Sauvegarder</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Chargement...' : 'Émettre'}
                  </Button>
                </CardFooter>
            </Form>
            </form>
          </CardContent>
        </Card>
        </div>

      </main>
    </>
  );
};

export default CreateEDBPage;