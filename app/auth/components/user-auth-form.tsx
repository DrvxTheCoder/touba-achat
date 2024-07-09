"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isLoadingProvider, setIsLoadingProvider] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
  
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
  
    console.log('Form Data:', { email, password });
  
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
  
    
  
    if (res?.error) {
      setIsLoading(false);
      if (res.error === 'CredentialsSignin') {
        setError('Email ou mot de passe invalide. Veuillez réessayer.');
      } else {
        setError('Une erreur inattendue s\'est produite. Veuillez réessayer ulterieurement.');
      }
    } else {
      await router.replace("/");
      setIsLoading(false);
    }
  }
  

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="my-2" htmlFor="email">
              Email :
            </Label>
            <Input
              id="email"
              name="email"
              placeholder="nom@touba-oil.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
            <Label className="my-2" htmlFor="password">
              Mot de Passe :
            </Label>
            <Input 
              id="password"
              name="password"
              placeholder="Votre mot de passe..."
              type="password"
              disabled={isLoading}
              required
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <Button type="submit" disabled={isLoading} className="mt-5">
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            <b>Continuer</b>
          </Button>
        </div>
      </form>
    </div>
  );
}
