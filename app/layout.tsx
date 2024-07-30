// app/layout.tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import AuthProvider from '@/app/api/auth/[...nextauth]/auth-provider';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
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
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}