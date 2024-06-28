"use client"

import { useState } from "react"
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
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const employeeFormSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Le nom doit comporter au moins 2 caractères." })
      .max(30, { message: "Le nom ne doit pas dépasser 30 caractères." }),
    department: z
      .string()
      .min(2, { message: "Le département doit comporter au moins 2 caractères." })
      .max(30, { message: "Le département ne doit pas dépasser 30 caractères." }),
    matriculation: z
      .string()
      .min(2, { message: "La matricule doit comporter au moins 2 caractères." })
      .max(30, { message: "La matricule ne doit pas dépasser 30 caractères." }),
    phone: z
      .string()
      .min(10, { message: "Le téléphone doit comporter au moins 10 caractères." })
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
    role: z.string().min(1, { message: "Veuillez sélectionner un rôle." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"], // This will set the error on the confirmPassword field
  })


type EmployeeFormValues = z.infer<typeof employeeFormSchema>

export function AddEmployeeForm() {
  const [section, setSection] = useState<"employee" | "credentials">("employee")

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
  })

  const onSubmit = (data: EmployeeFormValues) => {
    toast({
      title: "Données soumises",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
        <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline" className="mt-3">Ajouter</Button>
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
                          <FormLabel className="text-sm text-muted-foreground">Nom :</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel className="text-sm text-muted-foreground" >Département :</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="matriculation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-muted-foreground" >Matricule :</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel className="text-sm text-muted-foreground" >Téléphone :</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel className="text-sm text-muted-foreground" >Email :</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel className="text-sm text-muted-foreground" >Mot de passe :</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
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
                          <FormLabel className="text-sm text-muted-foreground" >Confirmer le mot de passe :</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
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
                          <FormLabel className="text-sm text-muted-foreground" >Rôle :</FormLabel>
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
                              <SelectItem value="DIRECTEUR_GENERAL">Directeur Général</SelectItem>
                              <SelectItem value="MAGASINIER">Magasinier</SelectItem>
                              <SelectItem value="RH">Ressources Humaines</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" type="button" onClick={() => setSection("employee")} className="mt-2">
                        Retour
                      </Button>
                      <Button type="submit" className="mt-2">Ajouter</Button>

                    </div>
                  </>
                )}


              </form>
            </Form>
        </DialogContent>
    </Dialog>
  )
}
