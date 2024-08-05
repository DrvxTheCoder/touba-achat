// app/dashboard/layout.tsx
"use client"

import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"
import useRequireAuth from '../hooks/use-require-auth';
import dynamic from 'next/dynamic';
import { Role } from '@prisma/client';
import NextProgress from '@/components/next-progress';

const DynamicBreadcrumbs = dynamic(() => import('@/components/DynamicBreadcrumbs'), { ssr: false });

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // const { session, loading } = useRequireAuth([Role.ADMIN, Role.DIRECTEUR, Role.DIRECTEUR_GENERAL, Role.MAGASINIER, Role.AUDIT, Role.IT_ADMIN ]);

  // if (loading) {
  //   return <div>Chargement...</div>;
  // }

  // if (!session) {
  //   return null;
  // }

  return (
    <>
      <NextProgress />
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <Header />
          <DynamicBreadcrumbs />
          <Toaster />
          {children}
        </div>
      </div>
    </>
  );
}