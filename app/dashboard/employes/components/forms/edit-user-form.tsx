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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Icons } from "@/components/icons"
import { Employee } from "../data"

const employeeUpdateSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  matriculation: z.string().min(2, { message: "La matricule doit comporter au moins 2 caractères." })
    .max(10, { message: "La matricule ne doit pas dépasser 10 caractères." }),
  phoneNumber: z.string().min(9, { message: "Le téléphone doit comporter au moins 10 caractères." })
    .max(15, { message: "Le téléphone ne doit pas dépasser 15 caractères." }),
  department: z.number(),
})

type EmployeeUpdateValues = z.infer<typeof employeeUpdateSchema>

interface UpdateEmployeeFormProps {
  employee: Employee
  onUpdate: (updatedEmployee: Employee) => void
}

export function UpdateEmployeeForm({ employee, onUpdate }: UpdateEmployeeFormProps) {
  const [updateButtonLoading, setUpdateButtonLoading] = useState(false)
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [section, setSection] = useState<"employee" | "credentials">("employee")

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data);
      })
      .catch((error) => {
        console.error('Failed to fetch departments:', error);
      });
  }, []);

  const form = useForm<EmployeeUpdateValues>({
    resolver: zodResolver(employeeUpdateSchema),
    defaultValues: {
      ...employee,
      phoneNumber: employee.phoneNumber || "",
      department: employee.department.id,
    },
    mode: "onChange",
  })

  const onSubmit = (data: EmployeeUpdateValues) => {
    setUpdateButtonLoading(true);
    onUpdate({ ...employee, ...data, department: { name: "", id: data.department } });
    setUpdateButtonLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="w-full">Modifier</div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
        e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle className="text-xl">Modifier l&apos;employé</DialogTitle>
          <DialogDescription>
            Modifiez les informations de l&apos;employé.
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
                      <FormLabel className="text-sm text-muted-foreground" >Direction :</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        value={field.value?.toString()}
                      >
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
                  name="phoneNumber"
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => setSection("employee")} className="mt-2">
                    <b>Retour</b>
                  </Button>
                  
                  <Button type="submit" className="mt-2" disabled={updateButtonLoading}>
                    {updateButtonLoading && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <b>Mettre à jour</b>
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