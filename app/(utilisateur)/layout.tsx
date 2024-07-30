// app/(utilisateur)/layout.tsx
"use client"

import React from 'react';
import useRequireAuth from '../hooks/use-require-auth';
import AdminPanelLayout from "@/components/user-panel/user-panel-layout";
import { Toaster } from "@/components/ui/toaster"

interface UtilisateurLayoutProps {
  children: React.ReactNode;
}

export default function UtilisateurLayout({ children }: UtilisateurLayoutProps) {
  const { session, loading } = useRequireAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <AdminPanelLayout>
      <Toaster />
      {children}
    </AdminPanelLayout>
  );
}