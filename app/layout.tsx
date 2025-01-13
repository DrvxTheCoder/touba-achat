// app/layout.tsx
import type { Metadata } from 'next';
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
import './globals.css';
import { NotificationProvider } from '@/components/NotificationProvider';
import { Toaster } from 'sonner';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'ToubaApp™',
  description: 'L\'application Web Officiel de Touba Oil SAU',
  
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="fr" suppressHydrationWarning>
      <Script async src="https://analytics.touba-app.com/script.js" data-website-id="5f206544-fb16-4f3b-9416-ddb4dcc131ab"/>
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

              <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)}/>
              <Toaster richColors position="top-right" closeButton pauseWhenPageIsHidden className='z-50'  />
              {children}

          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}