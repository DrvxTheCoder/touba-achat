// app/components/PageLayout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import AuthProvider from '@/app/api/auth/[...nextauth]/auth-provider';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import React from 'react';
import { NotificationProvider } from '@/components/NotificationProvider';
import { Toaster } from 'sonner';
import { redirect } from 'next/navigation';

export default async function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth');
  } else {
    if (['ADMIN', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'MAGASINIER', 'RH', 'AUDIT', 'RESPONSABLE'].includes(session.user.role)) {
      redirect('/dashboard');
    } else {
      redirect('/acceuil');
    }
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans no-scrollbar`}>
        <AuthProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="new-york"
            enableSystem
          >
            <NotificationProvider>
              <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)}/>
              <Toaster richColors position="top-right" closeButton  />
              {children}
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}