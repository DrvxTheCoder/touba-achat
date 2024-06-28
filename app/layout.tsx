// RootLayout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"
import ProgressBar from '@/components/ProgressBar';
import NextProgress from '@/components/next-progress';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options';
import AuthProvider from '@/app/api/auth/[...nextauth]/auth-provider';
import React, { Suspense } from 'react';

import './globals.css';

const metadata = {
  title: 'Touba Service Achat',
  description: 'L\'application Web Officiel du Service d\'Achat Touba Oil',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="user-scalable=no"/>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans no-scrollbar`}>
      <AuthProvider session={session}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextProgress />
            {children}
         </ThemeProvider>
      </AuthProvider>
      </body>
    </html>
  );
}
