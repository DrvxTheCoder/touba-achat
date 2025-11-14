"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from "../icons"
import { Plus, PlusCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AccessSelect } from "./AccessSelect"

const employeeFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
    department: z.string().min(1, { message: "Veuillez sélectionner une direction." }),
    jobTitle: z.string().min(1, { message: "La fonction est requise." }),
    matriculation: z
      .string()
      .min(2, { message: "La matricule doit comporter au moins 2 caractères." })
      .max(10, { message: "La matricule ne doit pas dépasser 10 caractères." }),
    phone: z
      .string()
      .min(9, { message: "Le téléphone doit comporter au moins 10 caractères." })
      .max(15, { message: "Le téléphone ne doit pas dépasser 15 caractères." }),
    email: z
      .string()
      .email({ message: "Veuillez entrer une adresse email valide." }),
    password: z
      .string()
      .min(6, { message: "Le mot de passe doit comporter au moins 6 caractères." }),
    confirmPassword: z.string().min(6, {
      message: "Le mot de passe de confirmation doit comporter au moins 6 caractères.",
    }),
    access: z.array(z.enum(['APPROVE_EDB', 'ATTACH_DOCUMENTS', 'CHOOSE_SUPPLIER', 'IT_APPROVAL', 'FINAL_APPROVAL', 'RH_APPROVE', 'RH_PROCESS', 'CASHIER', 'APPROVE_ODM', 'APPROVE_BDC', 'CREATE_PRODUCTION_INVENTORY', 'VIEW_PRODUCTION_DASHBOARD', 'VALIDATE_PRODUCTION_INVENTORY', 'EXPORT_PRODUCTION_REPORTS'])).optional(),
    role: z.string({ message: "Veuillez sélectionner un rôle." }).min(1, { message: "Veuillez sélectionner un rôle." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"], // This will set the error on the confirmPassword field
  })


type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export function AddEmployeeForm() {
  const [employeeButtonLoading, setEmployeeButtonLoading] = useState(false)
  const [section, setSection] = useState<"employee" | "credentials">("employee")
  const [open, setOpen] = useState(false); // State to manage dialog open/close

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        const departments = data.map((dept: { id: number, name: string }) => ({
          id: dept.id,
          name: dept.name,
        }));
        setDepartments(departments);
      })
      .catch((error) => {
        console.error('Failed to fetch departments:', error);
      });
  }, []);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
  })

  const onSubmit = (data: EmployeeFormValues) => {
    setEmployeeButtonLoading(true);

    const formData = {
      ...data,
      department: parseInt(data.department, 10)
    };
  
    // Prepare the request options
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    };
  
    // Send the POST request to the server
    fetch('/api/employee', requestOptions)
      .then(response => response.json()) // First, convert the response to JSON
      .then(result => {
        if (result.error) {
          // If there is an error message in the result, throw it to catch block
          throw new Error(result.error);
        }
        // Handle success with the message from the server
        toast.success("Succès - Ajout réussi!",{
          description: result.message || "Employé ajouté avec succès."
        });
        form.reset(); // Reset form on successful submit
        setOpen(false); // Close the dialog on successful submit
      })
      .catch(error => {
        // Handle error with the message from the server or a generic message
        toast.error("Erreur - Échec de l\'ajout!",{
          description: error.message || "Une erreur s'est produite.",
        });
        console.error('There was an error!', error);
      })
      .finally(() => {
        setEmployeeButtonLoading(false);
      });
  };

  return (
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            form.reset();
            setSection("employee");
          }
        }}>
        <DialogTrigger asChild>
        <Button variant="outline">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PlusCircle className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ajouter un employé</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
          e.preventDefault();
        }}>
            <DialogHeader>
                <DialogTitle className="text-xl">Ajouter un employé</DialogTitle>
                <DialogDescription>
                    Entrez les informations et les identifiants de l&apos;employé.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                {section === "employee" && (
                  <>
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} type="text" placeholder="Nom complet" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une direction" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {departments.map((department) => (
                                <SelectItem key={department.id} value={department.id.toString()}>
                                  {department.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="matriculation"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Matricule"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Fonction/Titre"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Nº Téléphone"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        type="button"
                        disabled={
                          !form.watch("name") ||
                          !form.watch("department") ||
                          !form.watch("matriculation") ||
                          !form.watch("jobTitle") ||
                          !form.watch("phone")
                        }
                        onClick={() => setSection("credentials")}
                        className="mt-2"
                      >
                        Suivant
                      </Button>
                    </div>
                  </>
                )}

                {section === "credentials" && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Email"/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Mot de passe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="password" {...field} placeholder="Confirmer le mot de passe" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un rôle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="ADMIN">Administrateur</SelectItem>
                              <SelectItem value="USER">Utilisateur</SelectItem>
                              <SelectItem value="RESPONSABLE">Responsable</SelectItem>
                              <SelectItem value="DIRECTEUR">Directeur / Directrice</SelectItem>
                              <SelectItem value="DAF">DAF</SelectItem>
                              <SelectItem value="DRH">DRH</SelectItem>
                              <SelectItem value="DOG">DOG</SelectItem>
                              <SelectItem value="DCM">DCM</SelectItem>
                              <SelectItem value="DIRECTEUR_GENERAL">Directeur Général</SelectItem>
                              <SelectItem value="MAGASINIER">Magasinier</SelectItem>
                              <SelectItem value="RH">Ressources Humaines</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="access"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <AccessSelect
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setSection("employee")}
                        className="mt-2"
                      >
                        Précédent
                      </Button>
                      <Button
                        type="submit"
                        className="mt-2"
                        disabled={!form.formState.isValid}
                      >
                        {employeeButtonLoading && (
                          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Ajouter
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Form>
        </DialogContent>
        </Dialog>
  )
}
