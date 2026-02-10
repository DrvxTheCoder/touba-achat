'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { CaretSortIcon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Role } from '@prisma/client';

interface ProductionCenter {
  id: number;
  name: string;
  address: string;
  chefProduction: {
    id: number;
    name: string;
    email: string;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface CenterSwitcherProps {
  className?: string;
  onCenterChange?: (center: ProductionCenter | null) => void;
}

const MAX_DISPLAY_LENGTH = 25;

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
};

const ALL_CENTERS: ProductionCenter = {
  id: -1,
  name: 'Tous les centres',
  address: '',
  chefProduction: { id: 0, name: '', email: '' },
};

export default function CenterSwitcher({ className, onCenterChange }: CenterSwitcherProps) {
  const { data: session } = useSession();
  const [addButtonLoading, setAddButtonLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [showNewCenterDialog, setShowNewCenterDialog] = React.useState(false);
  const [centers, setCenters] = React.useState<ProductionCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = React.useState<ProductionCenter | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    chefProductionId: '',
  });

  // Check if user can manage multiple centers (ADMIN, DIRECTEUR_GENERAL, DOG)
  const canManageMultipleCenters = React.useMemo(() => {
    if (!session?.user?.role) return false;
    return ['ADMIN', 'DIRECTEUR_GENERAL', 'DOG', 'DIRECTEUR'].includes(session.user.role);
  }, [session?.user?.role]);

  // Check if user can create centers
  const canCreateCenter = React.useMemo(() => {
    if (!session?.user?.role) return false;
    return ['ADMIN', 'IT_ADMIN'].includes(session.user.role);
  }, [session?.user?.role]);

  React.useEffect(() => {
    fetchCenters();
    if (canCreateCenter) {
      fetchUsers();
    }
  }, [canCreateCenter]);

  const fetchCenters = async () => {
    try {
      const response = await fetch('/api/production/settings/centers');
      if (!response.ok) throw new Error('Failed to fetch centers');
      const data: ProductionCenter[] = await response.json();

      // If user can manage multiple centers, add "All Centers" option
      // Auto-select the first actual center to avoid confusion
      if (canManageMultipleCenters) {
        setCenters([ALL_CENTERS, ...data]);
        const defaultCenter = data.length > 0 ? data[0] : ALL_CENTERS;
        setSelectedCenter(defaultCenter);
        onCenterChange && onCenterChange(defaultCenter.id === -1 ? null : defaultCenter);
      } else {
        // Find the center where user is chef
        const userCenter = data.find(
          (center) => center.chefProduction.id === parseInt(session?.user?.id || '0')
        );
        setCenters(data);
        setSelectedCenter(userCenter || (data.length > 0 ? data[0] : null));
        onCenterChange && onCenterChange(userCenter || (data.length > 0 ? data[0] : null));
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
      toast.error('Échec de la récupération des centres de production');
    }
  };

  const fetchUsers = async () => {
    try {
      // Fetch users with production access
      const response = await fetch('/api/users?access=CREATE_PRODUCTION_INVENTORY');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data: User[] = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Échec de la récupération des utilisateurs');
    }
  };

  const createCenter = async () => {
    setAddButtonLoading(true);

    if (!formData.name.trim() || !formData.address.trim() || !formData.chefProductionId) {
      setAddButtonLoading(false);
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch('/api/production/settings/centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          chefProductionId: parseInt(formData.chefProductionId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Échec lors de la création');
      }

      const newCenter = await response.json();

      // Update centers list
      if (canManageMultipleCenters) {
        setCenters([ALL_CENTERS, ...centers.filter(c => c.id !== -1), newCenter]);
      } else {
        setCenters([...centers, newCenter]);
      }

      setSelectedCenter(newCenter);
      onCenterChange && onCenterChange(newCenter);
      setFormData({ name: '', address: '', chefProductionId: '' });
      setShowNewCenterDialog(false);
      toast.success('Centre de production créé avec succès');
      setAddButtonLoading(false);
    } catch (error: any) {
      setAddButtonLoading(false);
      console.error('Error creating center:', error);
      toast.error(error.message || 'Une erreur s\'est produite lors de l\'ajout');
    }
  };

  const handleCenterSelect = (center: ProductionCenter) => {
    setSelectedCenter(center);
    setOpen(false);
    onCenterChange && onCenterChange(center.id === -1 ? null : center);
  };

  const isRestricted = !canManageMultipleCenters;

  return (
    <Dialog open={showNewCenterDialog} onOpenChange={setShowNewCenterDialog}>
      <Popover open={isRestricted ? false : open} onOpenChange={isRestricted ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Choisir un centre de production"
            disabled={isRestricted}
            className={cn('w-16 md:w-[250px] justify-between', isRestricted && 'opacity-60 cursor-not-allowed', className)}
          >
            <Avatar className="mr-2 h-5 w-5 flex-shrink-0">
              <AvatarImage
                src={`https://avatar.vercel.sh/${selectedCenter?.name || 'GPL'}.png`}
                alt={selectedCenter?.name || 'Production GPL'}
                className="grayscale"
              />
              <AvatarFallback>GPL</AvatarFallback>
            </Avatar>
            <span className="truncate inline-block">
              {selectedCenter ? truncateText(selectedCenter.name, MAX_DISPLAY_LENGTH) : 'Sélectionner'}
            </span>
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher..." />
            <ScrollArea className="max-h-[300px]">
              <CommandList>
                <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                <CommandGroup heading="Centres de production">
                  {centers.map((center) => (
                    <CommandItem
                      key={center.id}
                      onSelect={() => handleCenterSelect(center)}
                      className="cursor-pointer"
                    >
                      <Avatar className="mr-2 h-5 w-5 flex-shrink-0">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${center.name}.png`}
                          alt={center.name}
                          className="grayscale"
                        />
                        <AvatarFallback>GPL</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="truncate font-medium">{truncateText(center.name, 20)}</span>
                        {center.id !== -1 && (
                          <span className="text-xs text-muted-foreground truncate">
                            {truncateText(center.address, 25)}
                          </span>
                        )}
                      </div>
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4 flex-shrink-0',
                          selectedCenter?.id === center.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </ScrollArea>

            {canCreateCenter && (
              <>
                <CommandSeparator />
                <CommandList>
                  <CommandGroup>
                    <DialogTrigger asChild>
                      <CommandItem
                        onSelect={() => {
                          setOpen(false);
                          setShowNewCenterDialog(true);
                        }}
                        className="cursor-pointer"
                      >
                        <PlusCircledIcon className="mr-2 h-5 w-5" />
                        Créer un centre
                      </CommandItem>
                    </DialogTrigger>
                  </CommandGroup>
                </CommandList>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un centre de production</DialogTitle>
          <DialogDescription>
            Ajouter un nouveau centre de production GPL avec son chef de production.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="center-name">Nom du centre</Label>
            <Input
              id="center-name"
              placeholder="Ex: Centre GPL Touba"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="center-address">Adresse</Label>
            <Input
              id="center-address"
              placeholder="Ex: Touba, Sénégal"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chef-production">Chef de production</Label>
            <Select
              value={formData.chefProductionId}
              onValueChange={(value) => setFormData({ ...formData, chefProductionId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un chef" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowNewCenterDialog(false);
              setFormData({ name: '', address: '', chefProductionId: '' });
            }}
          >
            Annuler
          </Button>
          <Button onClick={createCenter} disabled={addButtonLoading}>
            {addButtonLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
