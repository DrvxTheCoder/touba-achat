import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';
import { Icons } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MISSION_TYPES = [
  'Audit & Inspection',
  'Formation & Certification',
  'Informatique',
  'Maintenance & Réparation',
  'Réunion & Conférence',
  'Supervision de Site',
  'Exploration & Prospection',
  'Commercial & Marketing',
  'Logistique & Transport',
  'Sécurité & HSE',
  'Autre'
] as const;


const accompanyingPersonSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "Le rôle est requis"),
});

const odmFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  missionType: z.string().min(1, "Le type de mission est requis"),
  location: z.string().min(1, "Le lieu est requis"),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }).refine(data => data.from <= data.to, {
    message: "La date de fin doit être après la date de début",
    path: ["to"],
  }),
  description: z.string().min(1, "La description est requise"),
  hasAccompanying: z.boolean(),
  accompanyingPersons: z.array(accompanyingPersonSchema).optional(),
});

type ODMFormData = z.infer<typeof odmFormSchema>;

interface ODMFormProps {
  onSubmit: (data: any) => void;
  initialData?: Partial<ODMFormData>;
  isLoading: boolean;
}



export function ODMSimpleForm({ onSubmit, initialData, isLoading }: ODMFormProps) {
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ODMFormData>({
    resolver: zodResolver(odmFormSchema),
    defaultValues: initialData || {
      title: '',
      missionType: '',
      location: '',
      dateRange: { from: new Date(), to: new Date() },
      description: '',
      hasAccompanying: false,
      accompanyingPersons: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "accompanyingPersons",
  });

  const hasAccompanying = watch("hasAccompanying");

  const handleFormSubmit = (data: ODMFormData) => {
    // Transform the data before submitting
    const transformedData = {
      ...data,
      startDate: data.dateRange.from,
      endDate: data.dateRange.to,
      dateRange: undefined
    };
    onSubmit(transformedData);
    reset({
      title: '',
      missionType: '',
      location: '',
      dateRange: { from: new Date(), to: new Date() },
      description: '',
      hasAccompanying: false,
      accompanyingPersons: [],
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="missionType">Type de Mission</Label>
        <Controller
          name="missionType"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner le type de mission" />
              </SelectTrigger>
              <SelectContent>
                {MISSION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.missionType && (
          <p className="text-red-500 text-sm">{errors.missionType.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="location">Lieu</Label>
        <Input id="location" {...register('location')} />
        {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
      </div>

      <div>
        <Label>Date</Label>
        <Controller
            name="dateRange"
            control={control}
            render={({ field }) => (
            <DatePickerWithRange
                className="w-full"
                onChange={(range: DateRange | undefined) => {
                field.onChange({
                    from: range?.from || new Date(),
                    to: range?.to || range?.from || new Date()
                });
                }}
                value={field.value}
            />
            )}
        />
        {errors.dateRange && <p className="text-red-500 text-sm">{errors.dateRange.message}</p>}
        </div>


      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Controller
          name="hasAccompanying"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="hasAccompanying"
              checked={field.value}
              onCheckedChange={(checked: boolean) => {
                field.onChange(checked);
                if (!checked) {
                  setValue('accompanyingPersons', []);
                }
              }}
            />
          )}
        />
        <Label htmlFor="hasAccompanying">Personnes accompagnantes</Label>
      </div>

      {hasAccompanying && (
        <div className="space-y-4">
          <ScrollArea className="w-full rounded-md h-28 p-2 border mb-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex space-x-2 gap-1 mb-2 p-1">
                <Input
                  {...register(`accompanyingPersons.${index}.name` as const)}
                  placeholder="Nom complet"
                />
                <Input
                  {...register(`accompanyingPersons.${index}.role` as const)}
                  placeholder="Rôle"
                />
                <Button type="button" variant="ghost" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', role: '' })}
            >
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter
            </Button>
          </ScrollArea>
          {errors.accompanyingPersons && <p className="text-red-500 text-sm">{errors.accompanyingPersons.message}</p>}

        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <b>Émettre</b>
      </Button>
    </form>
  );
}