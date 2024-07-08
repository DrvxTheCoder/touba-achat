import * as React from "react";
import { useSession } from "next-auth/react";
import { allowedReadRoles, allowedWriteRoles } from "@/app/hooks/use-allowed-roles";
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Department {
  id: number;
  name: string;
}

interface TeamSwitcherProps {
  className?: string;
  onDepartmentChange?: (department: Department | null) => void;
}

const MAX_DISPLAY_LENGTH = 20;

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

const ALL_DEPARTMENTS: Department = { id: -1, name: "Afficher Tout" };

export default function TeamSwitcher({ className, onDepartmentChange }: TeamSwitcherProps) {
  const { data: session } = useSession();
  const hasReadAccess = session && allowedReadRoles.includes(session.user.role);
  const hasWriteAccess = session && allowedWriteRoles.includes(session.user.role);
  const [addButtonloading, setAddButtonLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false);
  const [departments, setDepartments] = React.useState<Department[]>([ALL_DEPARTMENTS]);
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department>(ALL_DEPARTMENTS);
  const [newDepartmentName, setNewDepartmentName] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data: Department[] = await response.json();
      setDepartments([ALL_DEPARTMENTS, ...data]);
      setSelectedDepartment(ALL_DEPARTMENTS);
      onDepartmentChange && onDepartmentChange(null);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Erreur",
        description: "Échec de la récupération des départements. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };


  const createDepartment = async () => {
    setAddButtonLoading(true);
    if (!newDepartmentName.trim()) {
      setAddButtonLoading(false);
      toast({
        title: "Erreur",
        description: "Le champ ne pas être vide!",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDepartmentName }),
      });

      if (!response.ok) {
        throw new Error('Échec de lors de la création');
      }

      const newDepartment = await response.json();
      setDepartments([...departments, newDepartment]);
      setSelectedDepartment(newDepartment);
      onDepartmentChange && onDepartmentChange(newDepartment);
      setNewDepartmentName("");
      setShowNewTeamDialog(false);
      toast({
        title: "Succès",
        description: "Une nouvelle direction a été créé avec succèes.",
      });
      setAddButtonLoading(false);
    } catch (error) {
      setAddButtonLoading(false);
      console.error('Error creating department:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s\'est produite lors de l\'ajout. Veuillez ressayer.",
        variant: "destructive",
      });
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    console.log('Department selected:', department); // Log the selected department
    setSelectedDepartment(department);
    setOpen(false);
    onDepartmentChange && onDepartmentChange(department.id === -1 ? null : department);
  };

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Choisir une direction"
            className={cn("w-[200px] justify-between", className)}
          >
            <Avatar className="mr-2 h-5 w-5 flex-shrink-0">
              <AvatarImage
                src={`https://avatar.vercel.sh/${selectedDepartment?.name || 'TO'}.png`}
                alt={selectedDepartment?.name || 'Touba Oil'}
                className="grayscale"
              />
              <AvatarFallback>TO</AvatarFallback>
            </Avatar>
            <span className="truncate">
              {selectedDepartment ? truncateText(selectedDepartment.name, MAX_DISPLAY_LENGTH) : 'Select Department'}
            </span>
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Recherche..." />
            <ScrollArea>
            <CommandList>
              <CommandEmpty>Aucune résultat trouvé.</CommandEmpty>
              <CommandGroup heading="Directions">
                {departments.map((dept) => (
                  <CommandItem
                    key={dept.id}
                    onSelect={() => handleDepartmentSelect(dept)}
                  >
                    <Avatar className="mr-2 h-5 w-5 flex-shrink-0">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${dept.name}.png`}
                        alt={dept.name}
                        className="grayscale"
                      />
                      <AvatarFallback>TO</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{truncateText(dept.name, MAX_DISPLAY_LENGTH)}</span>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 flex-shrink-0",
                        selectedDepartment?.id === dept.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            </ScrollArea>
            
            {hasWriteAccess && (
              <>
              <CommandSeparator />
              <CommandList>
                <CommandGroup>
                  <DialogTrigger asChild>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setShowNewTeamDialog(true);
                      }}
                    >
                      <PlusCircledIcon className="mr-2 h-5 w-5" />
                      Créer un direction
                    </CommandItem>
                  </DialogTrigger>
                </CommandGroup>
              </CommandList>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un direction</DialogTitle>
          <DialogDescription>
            Ajouter une direction pour gérer les états de besoin et ordres de missions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la direction</Label>
            <Input
              id="name"
              placeholder="Touba Oil SAU."
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
            Annuler
          </Button>
          <Button onClick={createDepartment} disabled={addButtonloading}>
            {addButtonloading && (<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />)}Ajouter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}