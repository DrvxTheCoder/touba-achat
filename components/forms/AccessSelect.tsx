import React, { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Access } from '@prisma/client'

const accessOptions: { value: Access; label: string }[] = [
  { value: 'APPROVE_EDB', label: 'Approuver EDB' },
  { value: 'APPROVE_ODM', label: 'Approuver ODM' },
  { value: 'ATTACH_DOCUMENTS', label: 'Joindre des documents' },
  { value: 'CHOOSE_SUPPLIER', label: 'Choisir un fournisseur' },
  { value: 'IT_APPROVAL', label: 'Approbation IT' },
  { value: 'FINAL_APPROVAL', label: 'Approbation finale' },
  { value: 'RH_APPROVE', label: 'Approbation RH' },
  { value: 'RH_PROCESS', label: 'Traitement ODM' },
]

interface AccessSelectProps {
  value?: Access[];
  onChange: (value: Access[]) => void;
}

export function AccessSelect({ value, onChange }: AccessSelectProps) {
  const [open, setOpen] = useState(false);

  // Use a type guard to ensure value is an array
  const safeValue = Array.isArray(value) ? value : [];

  const selectedOptions = accessOptions.filter((option) => safeValue.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onClick={() => setOpen(!open)}
        >
          {selectedOptions.length > 0
            ? `${selectedOptions.length} sélectionné(s)`
            : "Sélectionner les accès"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" onInteractOutside={(e) => e.preventDefault()}>
        <Command>
          <CommandInput placeholder="Rechercher un accès..." />
          <CommandEmpty>Aucun accès trouvé.</CommandEmpty>
          <CommandGroup>
            {accessOptions.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  onChange(
                    safeValue.includes(option.value)
                      ? safeValue.filter((item) => item !== option.value)
                      : [...safeValue, option.value]
                  )
                  setOpen(true)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    safeValue.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}