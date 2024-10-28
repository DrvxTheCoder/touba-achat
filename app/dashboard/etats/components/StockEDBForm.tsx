"use client"
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Package2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Access, CategoryType } from "@prisma/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getEmployees } from '../../employes/components/data';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Category {
  id: number;
  name: string;
  type: CategoryType;
}
  
interface Department {
id: number;
name: string;
}

export type Employee = {
    id: number;
    name: string;
    email: string;
    matriculation: string;
    phoneNumber: string;
    userId: number;
    currentDepartmentId: number;
    status: string;
    access: Access[];
    currentDepartment: {
      id: number;
      name: string;
    };
  };

// Common stock items
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

const stockEdbSchema = z.object({
    description: z.object({
      items: z.array(z.object({
        name: z.string().min(1, "Le nom de l'article est requis"),
        quantity: z.number().min(1, "La quantité doit être supérieure à 0"),
      })).min(1, "Ajoutez au moins un article"),
      comment: z.string().optional(),
    }),
    categoryId: z.number().min(1, "La catégorie est requise"),
    employeeType: z.enum(['registered', 'external']),
    employeeId: z.number().optional(),
    externalEmployeeName: z.string().optional(),
    departmentId: z.number().optional(),
  }).refine((data) => {
    if (data.employeeType === 'registered') {
      return data.employeeId !== undefined;
    } else {
      return data.externalEmployeeName !== undefined && data.departmentId !== undefined;
    }
  }, {
    message: "Veuillez remplir les informations de l'employé correctement",
  });

type StockEdbFormData = z.infer<typeof stockEdbSchema>;

interface StockEdbDialogProps {
    categories: Category[];
    departments: Department[];
    onSubmit: (data: StockEdbFormData) => Promise<void>;
  }

export default function StockEdbDialog({
    categories, 
    departments, 
    onSubmit  
}: StockEdbDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([{ name: '', quantity: 1 }]);
  const [openComboboxes, setOpenComboboxes] = React.useState<{ [key: number]: boolean }>({});
  const [employeePopoverOpen, setEmployeePopoverOpen] = React.useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = React.useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isAddButtonLoading, setIsAddButtonLoading] = useState(false); 

  const form = useForm<StockEdbFormData>({
    resolver: zodResolver(stockEdbSchema),
    defaultValues: {
      description: {
        items: [{ name: '', quantity: 1 }],
        comment: '',
      },
      categoryId: undefined,
      employeeType: 'registered',
    },
  });

  const employeeType = form.watch('employeeType');

    useEffect(() => {
        const fetchEmployees = async () => {
        setIsLoadingEmployees(true);
        try {
            const data = await getEmployees(1, 100, employeeSearchTerm); // Increased limit
            setEmployees(data.employees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error("Erreur", {
            description: "Impossible de charger la liste des employés",
            });
        } finally {
            setIsLoadingEmployees(false);
        }
        };

        const delayDebounceFn = setTimeout(() => {
        if (employeePopoverOpen) {
            fetchEmployees();
        }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [employeeSearchTerm, employeePopoverOpen]);

    useEffect(() => {
        if (employeePopoverOpen && employees.length === 0) {
          const loadInitialEmployees = async () => {
            setIsLoadingEmployees(true);
            try {
              const data = await getEmployees(1, 10, '');
              setEmployees(data.employees);
            } catch (error) {
              console.error('Error loading initial employees:', error);
            } finally {
              setIsLoadingEmployees(false);
            }
          };
    
          loadInitialEmployees();
        }
      }, [employeePopoverOpen]);

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

  const handleSubmit = async (data: StockEdbFormData) => {
    try {
      setIsAddButtonLoading(true);
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
        setIsAddButtonLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package2 className="w-4 h-4" />
          Nouveau (en stock)
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
              name="employeeType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type d&apos;employé</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row gap-3"
                    >
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="registered" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Enregistré
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="external" />
                        </FormControl>
                        <FormLabel className="font-normal">
                         Non-enregistré
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {employeeType === 'registered' ? (
          <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Employé</FormLabel>
              <Popover 
                open={employeePopoverOpen} 
                onOpenChange={setEmployeePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeePopoverOpen}
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? employees.find((employee) => employee.id === field.value)?.name
                        : "Sélectionner un employé"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Rechercher un employé..."
                      onValueChange={setEmployeeSearchTerm}
                    />
                    <CommandEmpty>
                      {isLoadingEmployees ? (
                        "Chargement..."
                      ) : (
                        "Aucun employé trouvé."
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {employees.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={employee.name}
                          className="cursor-pointer"
                          onSelect={() => {
                            form.setValue("employeeId", employee.id);
                            setEmployeePopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              employee.id === field.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {employee.name} ({employee.currentDepartment.name})
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
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="externalEmployeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l&apos;employé</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom complet" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Département</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un département" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem 
                              key={department.id} 
                              value={department.id.toString()}
                            >
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
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
              <Button type="submit" disabled={isAddButtonLoading}>Enregistrer la demande {isAddButtonLoading && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}