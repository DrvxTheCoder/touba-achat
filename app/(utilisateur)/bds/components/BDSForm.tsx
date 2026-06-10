"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, LogOut } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icons } from "@/components/icons";
import { Access } from "@prisma/client";

const frenchDatePattern = /^\d{2}\/\d{2}\/\d{4}$/;
const frenchTimePattern = /^\d{2}:\d{2}$/;

const formatFrenchDate = (date: Date) => date.toLocaleDateString("fr-FR");
const formatFrenchTime = (date: Date) =>
  date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const employeeInfoSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  role: z.string().min(1, "Le rôle est requis"),
});

const bdsItemSchema = z.object({
  quantite: z.number().positive("La quantité doit être positive"),
  designation: z.string().min(1, "La désignation est requise"),
  observations: z.string().optional(),
});

const personnelFormSchema = z.object({
  type: z.literal("PERSONNEL"),
  motif: z.string().min(1, "Le motif est requis"),
  destination: z.string().optional(),
  date: z
    .string()
    .min(1, "La date est requise")
    .regex(frenchDatePattern, "La date doit être au format JJ/MM/AAAA"),
  heureSortie: z
    .string()
    .optional()
    .refine((value) => !value || frenchTimePattern.test(value), {
      message: "L'heure doit être au format HH:mm",
    }),
  heureRetour: z
    .string()
    .optional()
    .refine((value) => !value || frenchTimePattern.test(value), {
      message: "L'heure doit être au format HH:mm",
    }),
  employees: z.array(employeeInfoSchema).optional(),
  comment: z.string().optional(),
});

const materielFormSchema = z.object({
  type: z.literal("MATERIEL"),
  motif: z.string().min(1, "Le motif est requis"),
  destination: z.string().optional(),
  date: z
    .string()
    .min(1, "La date est requise"),
  heureSortie: z
    .string()
    .optional()
    .refine((value) => !value || frenchTimePattern.test(value), {
      message: "L'heure doit être au format HH:mm",
    }),
  heureRetour: z
    .string()
    .optional()
    .refine((value) => !value || frenchTimePattern.test(value), {
      message: "L'heure doit être au format HH:mm",
    }),
  vehicule: z.string().optional(),
  chauffeur: z.string().optional(),
  items: z.array(bdsItemSchema).optional(),
  nombreColis: z.number().int().optional(),
  isReturnable: z.boolean(),
  comment: z.string().optional(),
});

type PersonnelFormData = z.infer<typeof personnelFormSchema>;
type MaterielFormData = z.infer<typeof materielFormSchema>;

interface BDSFormProps {
  onSubmit: (data: PersonnelFormData | MaterielFormData) => Promise<void>;
  isLoading: boolean;
}

export function BDSForm({ onSubmit, isLoading }: BDSFormProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"PERSONNEL" | "MATERIEL">("PERSONNEL");

  const hasMaterielAccess =
    session?.user?.access?.includes(Access.CREATE_BDS_MATERIEL) ||
    ["ADMIN", "DIRECTEUR_GENERAL"].includes(session?.user?.role ?? "");

  const today = formatFrenchDate(new Date());

  const personnelForm = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      type: "PERSONNEL",
      motif: "",
      destination: "",
      date: today,
      heureSortie: "",
      heureRetour: "",
      employees: [],
      comment: "",
    },
  });

  const materielForm = useForm<MaterielFormData>({
    resolver: zodResolver(materielFormSchema),
    defaultValues: {
      type: "MATERIEL",
      motif: "",
      destination: "",
      date: today,
      heureSortie: "",
      heureRetour: "",
      vehicule: "",
      chauffeur: "",
      items: [{ quantite: 1, designation: "", observations: "" }],
      nombreColis: undefined,
      isReturnable: true,
      comment: "",
    },
  });

  const { fields: personnelEmployeeFields, append: appendPersonnelEmployee, remove: removePersonnelEmployee } =
    useFieldArray({ name: "employees", control: personnelForm.control });

  const { fields: materielItemFields, append: appendMaterielItem, remove: removeMaterielItem } =
    useFieldArray({ name: "items", control: materielForm.control });

  const handlePersonnelSubmit = async (data: PersonnelFormData) => {
    try {
      await onSubmit(data);
      personnelForm.reset({ type: "PERSONNEL", motif: "", destination: "", date: today, heureSortie: "", heureRetour: "", employees: [], comment: "" });
      setIsOpen(false);
    } catch (error) {
      console.error("Form error:", error);
    }
  };

  const handleMaterielSubmit = async (data: MaterielFormData) => {
    try {
      await onSubmit(data);
      materielForm.reset({ type: "MATERIEL", motif: "", destination: "", date: today, vehicule: "", chauffeur: "", items: [{ quantite: 1, designation: "" }], isReturnable: true, comment: "" });
      setIsOpen(false);
    } catch (error) {
      console.error("Form error:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <LogOut className="mr-2 h-4 w-4" />
          Nouveau BDS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b w-full p-4">
          <DialogTitle>Nouveau bon de sortie</DialogTitle>
          <DialogDescription>
            Remplissez les champs suivants pour créer votre demande de sortie.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "PERSONNEL" | "MATERIEL")}>
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="PERSONNEL">Personnel</TabsTrigger>
            {hasMaterielAccess && <TabsTrigger value="MATERIEL">Matériel</TabsTrigger>}
          </TabsList>

          {/* PERSONNEL TAB */}
          <TabsContent value="PERSONNEL">
            <ScrollArea style={{ height: "28rem" }} className="p-4">
              <Form {...personnelForm}>
                <form onSubmit={personnelForm.handleSubmit(handlePersonnelSubmit)} className="space-y-4 p-2">
                  <FormField
                    control={personnelForm.control}
                    name="motif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motif de la sortie *</FormLabel>
                        <FormControl>
                          <Input placeholder="Motif de la sortie" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personnelForm.control}
                    name="destination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="Destination" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={personnelForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="JJ/MM/AAAA"
                              inputMode="numeric"
                              pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personnelForm.control}
                      name="heureSortie"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure de sortie</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personnelForm.control}
                      name="heureRetour"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure de retour</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-row justify-between items-center">
                      <FormLabel>Employés concernés (optionnel)</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendPersonnelEmployee({ name: "", role: "" })}
                        className="text-primary h-7 p-2"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Ajouter
                      </Button>
                    </div>
                    {personnelEmployeeFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <FormField
                          control={personnelForm.control}
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
                          control={personnelForm.control}
                          name={`employees.${index}.role`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input placeholder="Fonction" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePersonnelEmployee(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <FormField
                    control={personnelForm.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commentaire (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ajouter un commentaire..." className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="submit" disabled={isLoading}>
                      Enregistrer la demande
                      {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </ScrollArea>
          </TabsContent>

          {/* MATERIEL TAB */}
          {hasMaterielAccess && (
            <TabsContent value="MATERIEL">
              <ScrollArea style={{ height: "28rem" }} className="p-4">
                <Form {...materielForm}>
                  <form onSubmit={materielForm.handleSubmit(handleMaterielSubmit)} className="space-y-4 p-2">
                    <FormField
                      control={materielForm.control}
                      name="motif"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motif de la sortie *</FormLabel>
                          <FormControl>
                            <Input placeholder="Motif de la sortie" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={materielForm.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="Destination" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={materielForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date *</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                inputMode="numeric"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materielForm.control}
                        name="heureSortie"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heure de sortie</FormLabel>
                            <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materielForm.control}
                        name="heureRetour"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heure de retour</FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={materielForm.control}
                        name="vehicule"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Véhicule (immatriculation)</FormLabel>
                            <FormControl>
                              <Input placeholder="Immatriculation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={materielForm.control}
                        name="chauffeur"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chauffeur</FormLabel>
                            <FormControl>
                              <Input placeholder="Nom du chauffeur" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-row justify-between items-center">
                        <FormLabel>Articles</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendMaterielItem({ quantite: 1, designation: "", observations: "" })}
                          className="text-primary h-7 p-2"
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
                      {materielItemFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <FormField
                            control={materielForm.control}
                            name={`items.${index}.quantite`}
                            render={({ field }) => (
                              <FormItem style={{ width: "80px" }}>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Qté"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={materielForm.control}
                            name={`items.${index}.designation`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Désignation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={materielForm.control}
                            name={`items.${index}.observations`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Observations" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMaterielItem(index)}
                            disabled={materielItemFields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <FormField
                      control={materielForm.control}
                      name="nombreColis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de colis (optionnel)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Nombre de colis"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={materielForm.control}
                      name="isReturnable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nature du matériel</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value ? "true" : "false"}
                              onValueChange={(v) => field.onChange(v === "true")}
                              className="flex flex-col gap-2 mt-1"
                            >
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="true" id="returnable-yes" />
                                <Label htmlFor="returnable-yes" className="font-normal cursor-pointer">
                                  Matériel retournable <span className="text-muted-foreground text-xs">(suivi de retour par article activé)</span>
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <RadioGroupItem value="false" id="returnable-no" />
                                <Label htmlFor="returnable-no" className="font-normal cursor-pointer">
                                  Matériel non retournable <span className="text-muted-foreground text-xs">(ex. citerne de gaz — retour heure uniquement)</span>
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={materielForm.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commentaire (optionnel)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Ajouter un commentaire..." className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isLoading}>
                        Enregistrer la demande
                        {isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
