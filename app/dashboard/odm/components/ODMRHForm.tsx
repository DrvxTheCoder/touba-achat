// components/ODMForm.tsx
import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRange } from 'react-day-picker';

interface ODMFormProps {
  onSubmit: (data: any) => void;
  initialData?: any;
}

export function ODMRHForm({ onSubmit, initialData }: ODMFormProps) {
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: initialData || {
      title: '',
      missionType: '',
      location: '',
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

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" {...register('title', { required: true })} />
      </div>

      <div>
        <Label htmlFor="missionType">Type de Mission</Label>
        <Input id="missionType" {...register('missionType', { required: true })} />
      </div>

      <div>
        <Label htmlFor="location">Lieu</Label>
        <Input id="location" {...register('location', { required: true })} />
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
      </div>



      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description', { required: true })} />
      </div>

      <div className="flex items-center space-x-2 mt-2">
        <Checkbox
          id="hasAccompanying"
          {...register('hasAccompanying')}
          onCheckedChange={(checked) => {
            setValue('hasAccompanying', checked);
            if (!checked) {
              setValue('accompanyingPersons', []);
            }
          }}
        />
        <Label htmlFor="hasAccompanying">Personnes accompagnantes</Label>
      </div>
      {hasAccompanying && (
        <div className="space-y-4">
            <ScrollArea className="w-full rounded-md h-28 p-2 border">
                {fields.map((field, index) => (
                <div key={field.id} className="flex space-x-2 gap-1 mb-2 p-1">
                    <Input
                        {...register(`accompanyingPersons.${index}.name` as const, { required: true })}
                        placeholder="Nom complet"
                    />
                    <Input
                        {...register(`accompanyingPersons.${index}.role` as const, { required: true })}
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

        </div>
      )}

      <Button type="submit" className="w-full">Emettre</Button>
    </form>
  );
}