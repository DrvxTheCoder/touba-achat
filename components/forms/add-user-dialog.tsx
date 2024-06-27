"use client";

import { useState } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const employeeSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    department: z.string().min(1, 'Le département est requis'),
    matriculation: z.string().min(1, 'Le matricule est requis'),
    phoneNumber: z.string().min(1, 'Le numéro de téléphone est requis'),
});

const credentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().min(1, 'Role is required'),
});

const AddUserDialog = () => {
  const methods = useForm({
    resolver: zodResolver(employeeSchema),
    mode: 'onChange',
  });
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (methods.formState.isValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (data: any) => {
    console.log(data);
    // Add your form submission logic here
  };

return (
    <Dialog>
        <DialogTrigger asChild>
            <Button variant="outline" className="mt-3">Ajouter</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle className="text-xl">Ajouter un employé</DialogTitle>
                <DialogDescription>
                    Entrez les informations et les identifiants de l&apos;employé.
                </DialogDescription>
            </DialogHeader>
            <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(handleSubmit)}>
                    {step === 1 && <EmployeeInfoSection />}
                    {step === 2 && <CredentialsSection />}
                    <DialogFooter>
                        {step === 1 && (
                            <>
                            <Button type="button" disabled={!methods.formState.isValid} onClick={handleNext} variant="outline">
                                Suivant
                            </Button>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <Button type="button" onClick={handleBack} variant="outline">
                                    Précédent
                                </Button>
                                <Button type="submit" className="font-bold">
                                    Ajouter
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </FormProvider>
        </DialogContent>
    </Dialog>
);
};

const EmployeeInfoSection = () => {
    const { register, formState: { errors } } = useFormContext();
    
    return (
      <div className="grid gap-3 py-4">
        <div className="items-center gap-4">
          <Label htmlFor="name" className="text-right text-sm text-muted-foreground">
            Prénom et Nom :
          </Label>
          <div className="cols-span-">
          <Input {...register("name")} id="name" className="col-span-8" />
          {errors.name?.message && typeof errors.name.message === 'string' && (
            <small className="text-red-600">{errors.name.message}</small>
          )}
          </div>
        </div>
        <div className="items-center gap-4">
          <Label htmlFor="department" className="text-right text-sm text-muted-foreground">
            Départment :
          </Label>
          <Input {...register("department")} id="department" className="col-span-3" />
          {errors.department?.message && typeof errors.department.message === 'string' && (
            <small className="text-red-600">{errors.department.message}</small>
          )}
        </div>
        <div className="items-center gap-4">
          <Label htmlFor="matriculation" className="text-right text-sm text-muted-foreground">
            Matricule :
          </Label>
          <Input {...register("matriculation")} id="matriculation" className="col-span-3" />
          {errors.matriculation?.message && typeof errors.matriculation.message === 'string' && (
            <small className="text-red-600">{errors.matriculation.message}</small>
          )}
        </div>
        <div className="items-center gap-4">
          <Label htmlFor="phoneNumber" className="text-right text-sm text-muted-foreground">
            N° Téléphone :
          </Label>
          <Input {...register("phoneNumber")} id="phoneNumber" className="col-span-3" />
          {errors.phoneNumber?.message && typeof errors.phoneNumber.message === 'string' && (
            <small className="text-red-600">{errors.phoneNumber.message}</small>
          )}
        </div>
      </div>
    );
  };
  

  const CredentialsSection = () => {
    const { register, formState: { errors } } = useFormContext();
    
    return (
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input {...register("email")} id="email" className="col-span-3" />
          {errors.email?.message && typeof errors.email.message === 'string' && (
            <small className="text-red">{errors.email.message}</small>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Password
          </Label>
          <Input {...register("password")} type="password" id="password" className="col-span-3" />
          {errors.password?.message && typeof errors.password.message === 'string' && (
            <p className="col-span-4 text-red-600">{errors.password.message}</p>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            Role
          </Label>
          <Input {...register("role")} id="role" className="col-span-3" />
          {errors.role?.message && typeof errors.role.message === 'string' && (
            <p className="col-span-4 text-red-600">{errors.role.message}</p>
          )}
        </div>
      </div>
    );
  };
  

export default AddUserDialog;
