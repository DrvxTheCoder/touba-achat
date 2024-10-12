"use client"
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryType } from "@prisma/client"
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getEmployees, Employee } from '../../employes/components/data'; // Adjust the import path as needed

const edbSchema = z.object({
  // title: z.string().min(1, "Ce champ est requis"),
  category: z.string().min(1, "Ce champ est requis"),
  reference: z.string().optional(),
  items: z.array(z.object({
    designation: z.string().min(1, "Ce champ est requis"),
    quantity: z.string().min(1, "Requis").regex(/^\d+$/, "La quantité doit être un nombre")
  })).min(1, "Au moins un élément est requis"),
  userId: z.number().min(1, "Ce champ est requis")
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();

  const form = useForm<EdbFormValues>({
    resolver: zodResolver(edbSchema),
    defaultValues: {
      // title: '',
      category: '',
      reference: '',
      items: [{ designation: '', quantity: '' }],
      userId: 0
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

  const fetchEmployees = async (search: string = '') => {
    try {
      const data = await getEmployees(1, 5, search); // Adjust limit as needed
      setEmployees(data.employees);
    } catch (err) {
      setError("Erreur lors de la récupération des employés");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchEmployees();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEmployees(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const onSubmit = async (data: EdbFormValues) => {
    setIsLoading(true);
    setError(null);
  
    const endpoint = '/api/edb/helper-edb';
  
    try {
      const response = await fetch(endpoint, {
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
      
      toast.success("EDB créé avec succès",{
        description: `L'EDB ${result.edbId} a été créé.`,
      });
  
      router.push('/dashboard/etats');
    } catch (err) {
      setError('Une erreur est survenue lors de la création de l\'EDB');
      toast.error("Erreur",{
        description: "Impossible de créer l'EDB. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <title>États de Besoins - Touba App™</title>
      <main className="flex flex-1 flex-col gap-4 px-4 md:gap-4 md:px-6">

        <div className="flex items-center justify-center">
        <Card className='w-[22rem] lg:w-[50rem] mt-2'>
          <CardHeader className='border-b'>
            <CardTitle>Créer un État de Besoin</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
            <Form {...form}>

            <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Utilisateur</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? employees.find((employee) => employee.id === field.value)?.name
                                : "Sélectionner un utilisateur"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Rechercher un utilisateur..." 
                              onValueChange={setSearchTerm}
                            />
                            <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                            <CommandGroup>
                              {employees.map((employee) => (
                                <CommandItem
                                className="cursor-pointer"
                                  key={employee.id}
                                  value={employee.name}
                                  onSelect={() => {
                                    form.setValue("userId", employee.id);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      employee.id === field.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {employee.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
                {/* <FormField
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
                /> */}
                
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
                
                <CardFooter className="flex justify-end gap-2 pt-4 px-0">
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