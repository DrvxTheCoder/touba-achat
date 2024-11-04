// dashboard/odm/components/AccompanyingPersonsForm.tsx
import { Controller, useFieldArray, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ODMPersonCategory, ODM_CATEGORY_LABELS, ODM_DAILY_RATES } from "../utils/odm";
import { PlusCircle, Trash2 } from "lucide-react";

interface AccompanyingPersonsFieldArrayProps {
  form: UseFormReturn<any>;
  hasAccompanying: boolean;
}

export function AccompanyingPersonsFieldArray({
  form,
  hasAccompanying
}: AccompanyingPersonsFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "accompanyingPersons"
  });

  const handleAddPerson = () => {
    append({ 
      name: '', 
      category: ODMPersonCategory.FIELD_AGENT,
      costPerDay: ODM_DAILY_RATES[ODMPersonCategory.FIELD_AGENT]
    });
  };

  if (!hasAccompanying) return null;

  return (
    <div className="space-y-4">
      <ScrollArea className="w-full rounded-md h-28 p-2 border">
        {fields.map((field, index) => (
          <div key={field.id} className="flex space-x-2 gap-1 mb-2 p-1">
            <Input
              {...form.register(`accompanyingPersons.${index}.name`)}
              placeholder="Nom complet"
            />
            <Controller
              name={`accompanyingPersons.${index}.category`}
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <Select
                  value={value}
                  onValueChange={(newValue: ODMPersonCategory) => {
                    onChange(newValue);
                    form.setValue(
                      `accompanyingPersons.${index}.costPerDay`,
                      ODM_DAILY_RATES[newValue]
                    );
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ODM_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddPerson}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </ScrollArea>
    </div>
  );
}