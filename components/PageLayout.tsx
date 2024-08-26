// app/components/PageLayout.tsx
"use client"
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
import { useRouter } from 'next/navigation';

export default async function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const router = useRouter();

  if (!session) {
    router.replace('/auth');
  } else {
    if (['ADMIN', 'DIRECTEUR', 'DIRECTEUR_GENERAL', 'MAGASINIER', 'RH', 'AUDIT', 'RESPONSABLE'].includes(session.user.role)) {
      router.replace('/dashboard');
    } else {
      router.replace('/acceuil');
    }
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
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