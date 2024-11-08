// components/stock/UserStockEDBForm.tsx
"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { CategoryType } from "@prisma/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";

// Common stock items (same as before)
const commonStockItems = [
    "Papier A4",
    "Stylos",
    "Cahiers",
    "Packet Mouchoirs",
    "Classeurs",
    "Agrafeuses",
    "Agrafes",
    "Enveloppes",
    "Marqueurs",
    "Chemises cartonnées",
    "Bloc-notes",
    "Correcteur",
    "Ciseaux",
    "Ruban adhésif",
    "Surligneurs",
  ].sort();

const userStockEdbSchema = z.object({
  description: z.object({
    items: z.array(z.object({
      name: z.string().min(1, "Le nom de l'article est requis"),
      quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
    })).min(1, "Ajoutez au moins un article"),
    comment: z.string().optional(),
  }),
  categoryId: z.number().min(1, "La catégorie est requise"),
});

type UserStockEdbFormData = z.infer<typeof userStockEdbSchema>;

interface Category {
  id: number;
  name: string;
  type: CategoryType;
}

interface UserStockEdbFormProps {
  categories: Category[];
  onSubmit: (data: UserStockEdbFormData) => Promise<void>;
}

export default function UserStockEdbForm({
  categories,
  onSubmit
}: UserStockEdbFormProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([{ name: '', quantity: 1 }]);
  const [openComboboxes, setOpenComboboxes] = useState<{ [key: number]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserStockEdbFormData>({
    resolver: zodResolver(userStockEdbSchema),
    defaultValues: {
      description: {
        items: [{ name: '', quantity: 1 }],
        comment: '',
      },
    },
  });

  const addItem = () => {
    setItems([...items, { name: '', quantity: 1 }]);
    const currentItems = form.getValues('description.items');
    form.setValue('description.items', [...currentItems, { name: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      const currentItems = form.getValues('description.items');
      form.setValue('description.items', currentItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (data: UserStockEdbFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      setOpen(false);
      form.reset();
      setItems([{ name: '', quantity: 1 }]);
      toast.success("Demande d'articles enregistrée", {
        description: "Votre demande d'articles en stock a été enregistrée avec succès."
      });
    } catch (error) {
      console.error("Error submitting stock EDB:", error);
      toast.error("Erreur", {
        description: "Une erreur est survenue lors de l'enregistrement de votre demande."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package2 className="w-4 h-4" />
          <text className="hidden md:block">Nouveau (en stock)</text>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Demande d&apos;Articles en Stock</DialogTitle>
          <DialogDescription>
            Formulaire pour les articles disponibles directement en stock.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Articles</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  Ajouter un article
                </Button>
              </div>
              <ScrollArea className="h-[200px] w-full border rounded-md p-1 gap-1 overflow-hidden">
              {items.map((_, index) => (
                <div key={index} className="flex items-center gap-1 mb-1 p-1">
                  <FormField
                    control={form.control}
                    name={`description.items.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Popover 
                          open={openComboboxes[index]} 
                          onOpenChange={(open) => {
                            setOpenComboboxes(prev => ({ ...prev, [index]: open }));
                          }}
                        >
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Sélectionner un article"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Nom un article..." 
                                onValueChange={(search) => {
                                  if (!commonStockItems.some(item => 
                                    item.toLowerCase().includes(search.toLowerCase())
                                  )) {
                                    field.onChange(search);
                                  }
                                }}
                              />
                              <CommandEmpty>
                                <div className="p-2 text-sm">
                                  Appuyez sur Entrée pour utiliser &quot;{field.value}&quot;
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {commonStockItems.map((item) => (
                                  <CommandItem
                                    key={item}
                                    value={item}
                                    onSelect={() => {
                                      field.onChange(item);
                                      setOpenComboboxes(prev => ({ ...prev, [index]: false }));
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        item === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {item}
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
                  
                  <FormField
                    control={form.control}
                    name={`description.items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              </ScrollArea>
              

            </div>

            <FormField
              control={form.control}
              name="description.comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Commentaire ou précisions supplémentaires" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>Enregistrer la demande {isSubmitting && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}