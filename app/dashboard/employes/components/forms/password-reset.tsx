import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Clipboard } from 'lucide-react';

interface ResetPasswordSheetProps {
  userId: Number;
  userEmail: string;
}

export function ResetPasswordSheet({ userId, userEmail }: ResetPasswordSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isGeneratePassword, setIsGeneratePassword] = useState(true);
  const [resetResult, setResetResult] = useState<{ password: string; email: string } | null>(null);
  const { toast } = useToast();

  const generatePassword = () => {
    // Generate a random password (you may want to improve this function)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const passwordToUse = isGeneratePassword ? generatePassword() : newPassword;

    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: passwordToUse }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation du mot de passe');
      }

      setResetResult({ password: passwordToUse, email: userEmail });
      toast({
        title: "Mot de passe réinitialisé",
        description: "Le mot de passe a été réinitialisé avec succès.",
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la réinitialisation du mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="w-full">Changer le mot de passe</div>
      </SheetTrigger>
      <SheetContent className='bg-card'>
        <SheetHeader>
          <SheetTitle>Réinitialiser le mot de passe</SheetTitle>
          <SheetDescription>
            Réinitialisez le mot de passe pour l&apos;utilisateur:
            <p className='text-primary'>{userEmail}</p>
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex items-center space-x-2 mb-8">
            <Switch
              id="generate-password"
              checked={isGeneratePassword}
              onCheckedChange={setIsGeneratePassword}
              
              
            />
            <Label htmlFor="generate-password">Générer automatiquement</Label>
          </div>
          {!isGeneratePassword && (
            <div className="space-y-4">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Changer le mot de passe
          </Button>
        </form>
        
        {resetResult && (
          <div className="mt-6 border border-dashed p-4 rounded-md cursor-pointer" onClick={() => {
            const textToCopy = `Mail: ${resetResult.email}\nMot de passe: ${resetResult.password}`;
            navigator.clipboard.writeText(textToCopy);
            toast({
              title: "Copie réussi",
              description: `Les identifiants ont été copié dans le presse-papier.`,
            })
          }}>
            <span className='flex items-center gap-2 text-sm text-primary'><Clipboard className="h-4 w-4 top-0 right-0"/> Copier dans le presse-papier</span>
            <Separator className='my-2' />
            <p className='text-sm'><text className='text-foreground'>Email :</text> {resetResult.email}</p>
            <p className='text-sm '>Nouveau mot de passe : <text className='text-foreground underline'> {resetResult.password}</text></p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

