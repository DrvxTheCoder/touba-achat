// components/odm/ODMSimpleForm.tsx
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccompanyingPersonsFieldArray } from './AccompanyingPersonsForm';
import { ODMPersonCategory } from '../utils/odm';
import RichTextEditor from './RichTextEditor';
import { DateRange } from 'react-day-picker';

interface RichTextContent {
  type: 'doc';
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{ type: string }>;
    }>;
    attrs?: Record<string, any>;
  }>;
}

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

// Updated schema for accompanying persons
const accompanyingPersonSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  category: z.nativeEnum(ODMPersonCategory, {
    errorMap: () => ({ message: "La catégorie est requise" })
  }),
  costPerDay: z.number().min(0, "Le coût journalier est requis")
});

const odmFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  missionType: z.string().min(1, "Le type de mission est requis"),
  location: z.string().min(1, "Le lieu est requis"),
  vehicule: z.string().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }).refine(data => data.from <= data.to, {
    message: "La date de fin doit être après la date de début",
    path: ["to"],
  }),
  description: z.any().refine((val) => {
    return val?.type === 'doc' && Array.isArray(val?.content);
  }, "La description est requise"),
  hasAccompanying: z.boolean(),
  accompanyingPersons: z.array(accompanyingPersonSchema)
    .optional()
    .nullable()
    .default([]),
});

type ODMFormData = z.infer<typeof odmFormSchema> & {
  description: RichTextContent;
};

interface ODMFormProps {
  onSubmit: (data: any) => void;
  initialData?: Partial<ODMFormData>;
  isLoading: boolean;
}

export function ODMSimpleForm({ onSubmit, initialData, isLoading }: ODMFormProps) {
  const defaultDescription: RichTextContent = {
    type: 'doc',
    content: [{ 
      type: 'paragraph',
      content: []
    }]
  };

  const form = useForm<ODMFormData>({
    resolver: zodResolver(odmFormSchema),
    defaultValues: initialData || {
      title: '',
      missionType: '',
      location: '',
      vehicule: '',
      dateRange: { from: new Date(), to: new Date() },
      description: defaultDescription,
      hasAccompanying: false,
      accompanyingPersons: [],
    }
  });

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = form;

  const hasAccompanying = watch("hasAccompanying");

  const handleFormSubmit = (data: ODMFormData) => {
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
      description: defaultDescription,
      hasAccompanying: false,
      accompanyingPersons: [],
    });
  };

  const requiredFields = watch(["title", "missionType", "location", "dateRange", "description"]);
  const isFormValid = requiredFields.every(field => field !== undefined && field !== '');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
      <div>
        <Input id="title" {...register('title')} placeholder='Titre' />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Controller
          name="missionType"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Type de mission" />
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
        <Input id="location" {...register('location')} placeholder='Lieu' />
        {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
      </div>

      <div>
        <Input 
          id="vehicule" 
          {...register('vehicule')}
          placeholder="Matricule du Véhicule (optionnel)"
        />
      </div>

      <div>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              error={!!errors.description}
              placeholder="Description..."
            />
          )}
        />
        {errors.description && (
          <p className="text-red-500 text-sm">
            {errors.description.message as string}
          </p>
        )}
      </div>

      <div className='flex flex-row gap-2 items-center'>
        <Label>Période: </Label>
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

      <div className="flex items-center space-x-2 py-2">
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
        <Label htmlFor="hasAccompanying">Collaborateurs</Label>
      </div>

      <AccompanyingPersonsFieldArray
        form={form}
        hasAccompanying={hasAccompanying}
      />

      <Button type="submit" className="w-full my-3" disabled={!isFormValid || isLoading}>
        {isLoading && (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        )}
        <b>Émettre</b>
      </Button>
    </form>
  );
}