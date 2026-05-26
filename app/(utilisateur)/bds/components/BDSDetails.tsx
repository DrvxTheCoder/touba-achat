"use client";

import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import { BDS, BDSItem, ReturnHistoryEntry, ReturnItem } from "../types/bds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  BanIcon,
  Trash2,
  AlertTriangle,
  LogOut,
  RotateCcw,
  Clock,
  Truck,
  Users,
  PackageCheck,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Access, BDSStatus } from "@prisma/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";

interface BDSDetailsProps {
  bds: BDS;
  onRefresh: () => Promise<void>;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Soumis",
  VALIDATED: "Validé",
  COMPLETED: "Sorti",
  RETURNED: "Retourné",
  REJECTED: "Rejeté",
};

const getBDSStatusVariant = (status: BDSStatus) => {
  switch (status) {
    case "SUBMITTED": return "secondary";
    case "VALIDATED": return "default";
    case "COMPLETED": return "outline";
    case "RETURNED": return "outline";
    case "REJECTED": return "destructive";
    default: return "secondary";
  }
};

const rejectFormSchema = z.object({
  reason: z.string().min(1, "La raison du rejet est requise"),
});
const dateTimeFormSchema = z.object({ customDateTime: z.string().optional() });

type RejectFormData = z.infer<typeof rejectFormSchema>;
type DateTimeFormData = z.infer<typeof dateTimeFormSchema>;

// Returns "dd/mm/yyyy HH:MM" from a datetime-local value ("yyyy-mm-ddTHH:MM")
function formatDateTimeLocal(value: string): string {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y} ${timePart}`;
}

// Returns the current datetime as a datetime-local string for input default
function nowAsDateTimeLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// Returns current date+time as a display string for "Valider maintenant"
function nowAsDisplayString(): string {
  return new Date().toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── helpers for return tracking ────────────────────────────────────────────

function computeTotalReturned(history: ReturnHistoryEntry[]): Record<string, number> {
  return history.reduce<Record<string, number>>((acc, entry) => {
    for (const item of entry.items) {
      acc[item.designation] = (acc[item.designation] || 0) + item.quantiteRetournee;
    }
    return acc;
  }, {});
}

// ─── Return-items editor (shared by first-return dialog & partial-return dialog) ─
interface ReturnItemEditorProps {
  originalItems: BDSItem[];
  alreadyReturned: Record<string, number>;
  quantities: Record<string, number>;
  onChange: (designation: string, value: number) => void;
  error: string | null;
}

function ReturnItemEditor({
  originalItems,
  alreadyReturned,
  quantities,
  onChange,
  error,
}: ReturnItemEditorProps) {
  const pendingItems = originalItems.filter(
    (item) => (alreadyReturned[item.designation] || 0) < item.quantite
  );

  if (pendingItems.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        Tous les articles ont déjà été retournés.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-[1fr_auto_80px] gap-x-3 gap-y-2 items-center text-sm">
        <span className="font-medium text-muted-foreground">Désignation</span>
        <span className="font-medium text-muted-foreground text-center">Restant</span>
        <span className="font-medium text-muted-foreground text-center">Qté retournée</span>

        {pendingItems.map((item) => {
          const already = alreadyReturned[item.designation] || 0;
          const remaining = item.quantite - already;
          return (
            <div className="contents" key={item.designation}>
              <span className="truncate">{item.designation}</span>
              <span className="text-center text-muted-foreground">
                {already}/{item.quantite}
              </span>
              <Input
                type="number"
                min={0}
                max={remaining}
                value={quantities[item.designation] ?? ""}
                placeholder={`max ${remaining}`}
                className="h-8 text-xs"
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  onChange(item.designation, isNaN(v) ? 0 : Math.min(v, remaining));
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function BDSDetails({ bds, onRefresh }: BDSDetailsProps) {
  const { data: session } = useSession();

  // dialog visibility
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isPartialReturnDialogOpen, setIsPartialReturnDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // shared state
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  // return-item quantities — used by both return + partial-return dialogs
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  const rejectForm = useForm<RejectFormData>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: { reason: "" },
  });
  const completeTimeForm = useForm<DateTimeFormData>({
    resolver: zodResolver(dateTimeFormSchema),
    defaultValues: { customDateTime: nowAsDateTimeLocal() },
  });
  const returnTimeForm = useForm<DateTimeFormData>({
    resolver: zodResolver(dateTimeFormSchema),
    defaultValues: { customDateTime: nowAsDateTimeLocal() },
  });

  // ── derived data ────────────────────────────────────────────────────────
  const isMateriel = bds.type === "MATERIEL";
  const originalItems: BDSItem[] = isMateriel && Array.isArray(bds.items) ? (bds.items as BDSItem[]) : [];
  const returnHistory: ReturnHistoryEntry[] = Array.isArray(bds.returnHistory) ? (bds.returnHistory as ReturnHistoryEntry[]) : [];
  const alreadyReturned = useMemo(() => computeTotalReturned(returnHistory), [returnHistory]);

  const userRole = session?.user?.role ?? "";
  const userAccess: string[] = session?.user?.access ?? [];
  const VALIDATOR_ROLES = ["ADMIN", "DIRECTEUR_GENERAL", "DIRECTEUR", "DAF", "DCM", "DOG", "DRH"];
  const canValidate = VALIDATOR_ROLES.includes(userRole) || userAccess.includes(Access.APPROVE_BDS);
  const isGardien = userRole === "GARDIEN";
  const isCreator = session?.user?.id && parseInt(session.user.id) === bds.userCreator?.id;
  const isAdmin = userRole === "ADMIN";

  const canMarkComplete = isGardien && bds.status === "VALIDATED";
  const canMarkReturn = isGardien && bds.status === "COMPLETED" && !!bds.heureRetour;
  // Gardien can add partial returns on RETURNED MATERIEL BDS that aren't fully accounted for
  const canPartialReturn =
    isGardien &&
    bds.status === "RETURNED" &&
    isMateriel &&
    bds.isReturnable &&
    !bds.isFullyReturned &&
    originalItems.length > 0;
  const canDelete = isAdmin || (isCreator && bds.status === "SUBMITTED");

  // ── handlers ────────────────────────────────────────────────────────────

  const handleQuantityChange = (designation: string, value: number) => {
    setItemError(null);
    setReturnQuantities((prev) => ({ ...prev, [designation]: value }));
  };

  const buildReturnedItems = () =>
    Object.entries(returnQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([designation, quantiteRetournee]) => ({ designation, quantiteRetournee }));

  const resetReturnState = () => {
    setReturnQuantities({});
    setItemError(null);
    setShowCustomTime(false);
    completeTimeForm.reset({ customDateTime: nowAsDateTimeLocal() });
    returnTimeForm.reset({ customDateTime: nowAsDateTimeLocal() });
  };

  const handleValidate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bds?id=${bds.id}&action=validate`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      toast.success("BDS validé avec succès");
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", { description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsValidateDialogOpen(false);
      setIsLoading(false);
    }
  };

  const handleReject = async (data: RejectFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bds?id=${bds.id}&action=reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: data.reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      toast.success("BDS rejeté");
      setIsRejectDialogOpen(false);
      rejectForm.reset();
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", { description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async (customDateTime?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bds?id=${bds.id}&action=complete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heureSortieEffective: customDateTime ?? nowAsDisplayString() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      toast.success("Sortie confirmée");
      setIsCompleteDialogOpen(false);
      resetReturnState();
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", { description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (customDateTime?: string) => {
    const returnedItems = isMateriel ? buildReturnedItems() : undefined;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/bds?id=${bds.id}&action=return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heureRetourEffective: customDateTime ?? nowAsDisplayString(),
          returnedItems,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      toast.success("Retour confirmé");
      setIsReturnDialogOpen(false);
      resetReturnState();
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", { description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartialReturn = async () => {
    const returnedItems = buildReturnedItems();
    if (returnedItems.length === 0) {
      setItemError("Veuillez saisir au moins une quantité à retourner.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bds?id=${bds.id}&action=partial-return`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedItems }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      toast.success("Retour partiel enregistré");
      setIsPartialReturnDialogOpen(false);
      resetReturnState();
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", { description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bds?id=${bds.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Erreur");
      toast.success("BDS supprimé avec succès");
      await onRefresh();
    } catch (error) {
      toast.error("Erreur", { description: error instanceof Error ? error.message : "Une erreur est survenue" });
    } finally {
      setIsDeleteDialogOpen(false);
      setIsLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">Détails du BDS</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {isMateriel ? <><Truck className="h-3 w-3 mr-1" />Matériel</> : <><Users className="h-3 w-3 mr-1" />Personnel</>}
            </Badge>
            <Badge variant={getBDSStatusVariant(bds.status as BDSStatus)} className="text-xs">
              {STATUS_LABEL[bds.status] ?? bds.status}
            </Badge>
            {isMateriel && bds.status === "RETURNED" && bds.isReturnable && (
              <Badge variant={bds.isFullyReturned ? "default" : "secondary"} className="text-xs">
                {bds.isFullyReturned ? <><PackageCheck className="h-3 w-3 mr-1" />Complet</> : "Retour partiel"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <ScrollArea className="h-[420px] p-4 border border-dashed rounded-lg">
            <div className="space-y-4">

              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-2">Informations Générales</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-muted-foreground">ID:</p><p>{bds.bdsId}</p></div>
                  <div><p className="text-muted-foreground">Département:</p><p>{bds.department.name}</p></div>
                  <div><p className="text-muted-foreground">Créé par:</p><p>{bds.creator.name}</p></div>
                  <div><p className="text-muted-foreground">Date:</p><p>{formatDate(bds.date)}</p></div>
                  {bds.destination && <div><p className="text-muted-foreground">Destination:</p><p>{bds.destination}</p></div>}
                  {bds.heureSortie && <div><p className="text-muted-foreground">Heure sortie prévue:</p><p>{bds.heureSortie}</p></div>}
                  {bds.heureRetour && <div><p className="text-muted-foreground">Heure retour prévue:</p><p>{bds.heureRetour}</p></div>}
                  {bds.validator && <div><p className="font-extrabold">Validé par:</p><p>{bds.validator.name}</p></div>}
                  {bds.rejector && <div><p className="font-extrabold text-destructive">Rejeté par:</p><p>{bds.rejector.name}</p></div>}
                </div>
              </div>

              <Separator />

              {/* Motif */}
              <div>
                <h3 className="font-semibold mb-2">Motif</h3>
                <p className="text-sm">{bds.motif}</p>
              </div>

              <Separator />

              {/* Personnel employees */}
              {!isMateriel && bds.employees && bds.employees.length > 0 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Employés Concernés</h3>
                    <Table>
                      <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Fonction</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {bds.employees.map((emp, i) => (
                          <TableRow key={i}><TableCell>{emp.name}</TableCell><TableCell>{emp.role}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Separator />
                </>
              )}

              {/* Materiel items */}
              {isMateriel && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Informations Matériel</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      {bds.vehicule && <div><p className="text-muted-foreground">Véhicule:</p><p>{bds.vehicule}</p></div>}
                      {bds.chauffeur && <div><p className="text-muted-foreground">Chauffeur:</p><p>{bds.chauffeur}</p></div>}
                      {bds.nombreColis != null && <div><p className="text-muted-foreground">Nombre de colis:</p><p>{bds.nombreColis}</p></div>}
                      <div>
                        <p className="text-muted-foreground">Nature du matériel:</p>
                        <p>{bds.isReturnable ? "Retournable" : "Non retournable"}</p>
                      </div>
                    </div>

                    {originalItems.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Qté initiale</TableHead>
                            <TableHead>Désignation</TableHead>
                            <TableHead>Observations</TableHead>
                            {bds.isReturnable && bds.status === "RETURNED" && <TableHead className="text-right">Retourné</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {originalItems.map((item, i) => {
                            const returned = alreadyReturned[item.designation] || 0;
                            const fullyBack = returned >= item.quantite;
                            return (
                              <TableRow key={i} className={bds.isReturnable && bds.status === "RETURNED" && fullyBack ? "text-muted-foreground" : ""}>
                                <TableCell>{item.quantite}</TableCell>
                                <TableCell>{item.designation}</TableCell>
                                <TableCell>{item.observations || "-"}</TableCell>
                                {bds.isReturnable && bds.status === "RETURNED" && (
                                  <TableCell className="text-right">
                                    <span className={fullyBack ? "text-green-600 font-medium" : "text-orange-500 font-medium"}>
                                      {returned}/{item.quantite}
                                    </span>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                  <Separator />
                </>
              )}

              {/* Effective times */}
              {(bds.heureSortieEffective || bds.heureRetourEffective) && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Heures Effectives</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {bds.heureSortieEffective && (
                        <div>
                          <p className="text-muted-foreground">Sortie effective:</p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{bds.heureSortieEffective}
                            {bds.completedBy && <span className="text-muted-foreground ml-1">({bds.completedBy.name})</span>}
                          </p>
                        </div>
                      )}
                      {bds.heureRetourEffective && (
                        <div>
                          <p className="text-muted-foreground">Retour effectif:</p>
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{bds.heureRetourEffective}
                            {bds.returnedBy && <span className="text-muted-foreground ml-1">({bds.returnedBy.name})</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Return history — only for returnable MATERIEL */}
              {isMateriel && bds.isReturnable && returnHistory.length > 0 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-2">Historique des retours</h3>
                    <div className="space-y-3">
                      {returnHistory.map((entry, idx) => (
                        <div key={idx} className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.returnedAt).toLocaleString("fr-FR")}
                            {entry.heureRetour && ` — ${entry.heureRetour}`}
                          </p>
                          {entry.items.length > 0 ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {entry.items.map((item, j) => (
                                <li key={j}>
                                  <span className="font-medium">{item.quantiteRetournee}</span> × {item.designation}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted-foreground italic">Retour sans détail d&apos;articles</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {bds.comment && (
                <div>
                  <h3 className="font-semibold mb-2">Commentaire</h3>
                  <p className="text-sm">{bds.comment}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {bds.rejectionReason && (
            <div className="flex flex-row items-center text-destructive h-8 gap-1">
              <BanIcon className="mr-2 h-4 w-4" />
              {`Justificatif: ${bds.rejectionReason}`}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-row justify-between items-center gap-2 pt-4 border-t">
            <div className="flex flex-row flex-wrap gap-2">
              {canValidate && bds.status === "SUBMITTED" && (
                <Button onClick={() => setIsValidateDialogOpen(true)} disabled={isLoading} variant="outline" className="text-primary h-8 gap-1">
                  <CheckCircle className="mr-1 h-4 w-4" />Valider
                </Button>
              )}
              {canValidate && bds.status === "SUBMITTED" && (
                <Button onClick={() => setIsRejectDialogOpen(true)} disabled={isLoading} variant="outline" className="text-destructive h-8 gap-1">
                  <BanIcon className="mr-1 h-4 w-4" />Rejeter
                </Button>
              )}
              {canMarkComplete && (
                <Button onClick={() => { resetReturnState(); setIsCompleteDialogOpen(true); }} disabled={isLoading} variant="outline" className="text-orange-500 h-8 gap-1">
                  <LogOut className="mr-1 h-4 w-4" />Marquer comme sortie
                </Button>
              )}
              {canMarkReturn && (
                <Button onClick={() => { resetReturnState(); setIsReturnDialogOpen(true); }} disabled={isLoading} variant="outline" className="text-purple-500 h-8 gap-1">
                  <RotateCcw className="mr-1 h-4 w-4" />Marquer le retour
                </Button>
              )}
              {canPartialReturn && (
                <Button onClick={() => { resetReturnState(); setIsPartialReturnDialogOpen(true); }} disabled={isLoading} variant="outline" className="text-blue-500 h-8 gap-1">
                  <PackageCheck className="mr-1 h-4 w-4" />Enregistrer un retour
                </Button>
              )}
            </div>
            {canDelete && (
              <Button onClick={() => setIsDeleteDialogOpen(true)} disabled={isLoading} variant="destructive" className="h-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Validate dialog ─────────────────────────────────────────────── */}
      <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le bon de sortie</DialogTitle>
            <DialogDescription>Êtes-vous sûr de vouloir valider ce bon de sortie ?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 p-3 rounded-lg w-full border border-dashed">
            <p className="text-sm font-bold">Créateur: <span className="font-normal">{bds.creator.name}</span></p>
            <p className="text-sm font-bold">Motif: <span className="font-normal">{bds.motif}</span></p>
            <p className="text-sm font-bold">Département: <span className="font-normal">{bds.department.name}</span></p>
          </div>
          <DialogFooter>
            <div className="w-full flex flex-row justify-between items-center">
              <p className="text-muted-foreground flex flex-row gap-1 items-center font-medium">
                <AlertTriangle className="h-3 w-3" /><small>Action irréversible</small>
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsValidateDialogOpen(false)} disabled={isLoading}>Annuler</Button>
                <Button onClick={handleValidate} disabled={isLoading}>
                  Confirmer{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ───────────────────────────────────────────────── */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeter le bon de sortie</DialogTitle></DialogHeader>
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
              <FormField control={rejectForm.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Raison du rejet</FormLabel>
                  <FormControl><Textarea placeholder="Expliquez la raison du rejet..." className="resize-none" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsRejectDialogOpen(false)} disabled={isLoading}>Annuler</Button>
                <Button type="submit" disabled={isLoading} variant="destructive">
                  Rejeter{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Complete (Sortie) dialog ─────────────────────────────────────── */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={(open) => { setIsCompleteDialogOpen(open); if (!open) resetReturnState(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la sortie</DialogTitle>
            <DialogDescription>Choisissez comment enregistrer l&apos;heure de sortie.</DialogDescription>
          </DialogHeader>
          {showCustomTime ? (
            <Form {...completeTimeForm}>
              <form onSubmit={completeTimeForm.handleSubmit((d) => handleComplete(d.customDateTime ? formatDateTimeLocal(d.customDateTime) : undefined))} className="space-y-4">
                <FormField control={completeTimeForm.control} name="customDateTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date et heure de sortie</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setShowCustomTime(false)} disabled={isLoading}>Retour</Button>
                  <Button type="submit" disabled={isLoading}>Valider{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <DialogFooter>
              <div className="w-full flex justify-between gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsCompleteDialogOpen(false)} disabled={isLoading}>Annuler</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCustomTime(true)} disabled={isLoading}>Valider (date/heure)</Button>
                  <Button type="button" onClick={() => handleComplete()} disabled={isLoading}>
                    Valider maintenant{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Return dialog ───────────────────────────────────────────────── */}
      <Dialog open={isReturnDialogOpen} onOpenChange={(open) => { setIsReturnDialogOpen(open); if (!open) resetReturnState(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmer le retour</DialogTitle>
            <DialogDescription>
              {isMateriel
                ? "Indiquez les quantités retournées (optionnel) puis confirmez le retour."
                : "Choisissez comment enregistrer l'heure de retour."}
            </DialogDescription>
          </DialogHeader>

          {/* Item quantity inputs — only for returnable MATERIEL */}
          {isMateriel && bds.isReturnable && originalItems.length > 0 && (
            <div className="py-2">
              <p className="text-sm font-medium mb-3">Articles retournés (optionnel)</p>
              <ReturnItemEditor
                originalItems={originalItems}
                alreadyReturned={{}}
                quantities={returnQuantities}
                onChange={handleQuantityChange}
                error={itemError}
              />
            </div>
          )}

          {showCustomTime ? (
            <Form {...returnTimeForm}>
              <form onSubmit={returnTimeForm.handleSubmit((d) => handleReturn(d.customDateTime ? formatDateTimeLocal(d.customDateTime) : undefined))} className="space-y-4">
                <FormField control={returnTimeForm.control} name="customDateTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date et heure de retour</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setShowCustomTime(false)} disabled={isLoading}>Retour</Button>
                  <Button type="submit" disabled={isLoading}>Valider{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}</Button>
                </DialogFooter>
              </form>
            </Form>
          ) : (
            <DialogFooter>
              <div className="w-full flex justify-between gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsReturnDialogOpen(false)} disabled={isLoading}>Annuler</Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCustomTime(true)} disabled={isLoading}>Valider (date/heure)</Button>
                  <Button type="button" onClick={() => handleReturn()} disabled={isLoading}>
                    Valider maintenant{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Partial return dialog ────────────────────────────────────────── */}
      <Dialog open={isPartialReturnDialogOpen} onOpenChange={(open) => { setIsPartialReturnDialogOpen(open); if (!open) resetReturnState(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />Enregistrer un retour
            </DialogTitle>
            <DialogDescription>
              Saisissez les quantités effectivement retournées pour chaque article.
            </DialogDescription>
          </DialogHeader>

          <ReturnItemEditor
            originalItems={originalItems}
            alreadyReturned={alreadyReturned}
            quantities={returnQuantities}
            onChange={handleQuantityChange}
            error={itemError}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsPartialReturnDialogOpen(false)} disabled={isLoading}>Annuler</Button>
            <Button onClick={handlePartialReturn} disabled={isLoading}>
              Confirmer le retour{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ───────────────────────────────────────────────── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer le bon de sortie</DialogTitle></DialogHeader>
          <div className="py-3">
            <p>Êtes-vous sûr de vouloir supprimer ce bon de sortie ? Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>Annuler</Button>
            <Button onClick={handleDelete} disabled={isLoading} variant="destructive">
              Supprimer{isLoading && <Icons.spinner className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
