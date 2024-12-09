// app/dashboard/layout.tsx
"use client"

import React from 'react';
import useRequireAuth from '../hooks/use-require-auth';
import NextProgress from '@/components/next-progress';
import UserPanelLayout from "@/components/user-panel/user-panel-layout";
import { ContentLayout } from "@/components/user-panel/content-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Session } from 'next-auth';

// Define allowed roles type
type AllowedRole = 
  | "ADMIN"
  | "DIRECTEUR"
  | "RESPONSABLE"
  | "DIRECTEUR_GENERAL"
  | "MAGASINIER"
  | "AUDIT"
  | "DAF"
  | "DOG"
  | "DRH"
  | "DCM"
  | "IT_ADMIN"
  | "RH";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const UnauthorizedContent = () => (
  <ContentLayout title="Non-autorisé">
    <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Non-autorisé</h1>
      </div>
      <div className="flex items-center justify-center rounded-lg h-[42rem] border border-dashed">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Accès interdit
          </h3>
          <p className="text-sm text-muted-foreground">
            Vous n&apos;avez pas le droit d&apos;acceder à ce contenu.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/acceuil">Retourner à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </main>
  </ContentLayout>
);

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { session, loading } = useRequireAuth();
  
  if (loading) {
    return (
      <UserPanelLayout>
        <ContentLayout title="Chargement...">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </ContentLayout>
      </UserPanelLayout>
    );
  }

  const allowedRoles: AllowedRole[] = [
    "ADMIN",
    "DIRECTEUR",
    "RESPONSABLE",
    "DIRECTEUR_GENERAL",
    "MAGASINIER",
    "AUDIT",
    "IT_ADMIN",
    "RH",
    "DAF",
    "DCM",
    "DOG",
    "DRH"
  ];

  // Type guard to check if role is allowed
  const isAllowedRole = (role: string): role is AllowedRole => {
    return allowedRoles.includes(role as AllowedRole);
  };

  if (!session?.user?.role || !isAllowedRole(session.user.role)) {
    return (
      <UserPanelLayout>
        <UnauthorizedContent />
      </UserPanelLayout>
    );
  }

  return (
    <UserPanelLayout>
      <NextProgress />
      {children}
    </UserPanelLayout>
  );
}