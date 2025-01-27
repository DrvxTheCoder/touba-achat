"use client"

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Plus, Trash2, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

// Validation schema
const expenseItemSchema = z.object({
  item: z.string().min(1, "L'article est requis"),
  amount: z.number().positive("Le montant doit être positif"),
});

const employeeInfoSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "Le rôle est requis"),
});

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.array(expenseItemSchema).min(1, "Au moins un article est requis"),
  employees: z.array(employeeInfoSchema).optional(),
  comment: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BDCFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isLoading: boolean;
}

export function BDCForm({ onSubmit, isLoading }: BDCFormProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: [{ item: "", amount: 0 }],
      employees: [], // Empty array as default
      comment: "",
    },
  });

  const { fields: expenseFields, append: appendExpense, remove: removeExpense } = 
    useFieldArray({
      name: "description",
      control: form.control,
    });

  const { fields: employeeFields, append: appendEmployee, remove: removeEmployee } = 
    useFieldArray({
      name: "employees",
      control: form.control,
    });

  const onFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <FileText className="mr-2 h-4 w-4" />
          Nouveau BDC
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b w-full p-4">
          <DialogTitle>Nouveau bon de caisse</DialogTitle>
          <DialogDescription>
            Remplissez les champs suivants pour émettre votre demande.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea style={{height: "25rem"}} className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6 p-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre/Motif</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre du bon de caisse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expense Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FormLabel>Articles / Montants</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendExpense({ item: "", amount: 0 })}
                    className="h-7 p-2 text-primary"
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Ajouter
                  </Button>
                </div>
                {expenseFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`description.${index}.item`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Article" {...field} className="md:w-96" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`description.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Montant"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExpense(index)}
                      disabled={expenseFields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              

               {/* Employees */}
              
              <div className="space-y-4">
              <div className="flex flex-row justify-between items-center gap-2">
                    <FormLabel>Employés Concernés (Optionnel)</FormLabel>
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEmployee({ name: "", role: "" })}
                    className="text-primary h-7 p-2"
                    >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter
                    </Button>
                </div>
                {employeeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-4">
                    <FormField
                      control={form.control}
                      name={`employees.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`employees.${index}.role`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Rôle" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmployee(index)}
                      disabled={employeeFields.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ajouter un commentaire..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
              <Button type="submit" disabled={isLoading}>Enregistrer la demande {isLoading && (<Icons.spinner className="ml-2 h-4 w-4 animate-spin" />)}</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}