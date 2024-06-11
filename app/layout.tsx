import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"
import ProgressBar from '@/components/ProgressBar';
import NextProgress from '@/components/next-progress';

import './globals.css';

export const metadata = {
  title: 'Touba Service Achat',
  description: 'L\'application Web Officiel du Service d\'Achat Touba Oil',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="fr">
      <meta name="viewport" content="user-scalable=no"/>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans no-scrollbar`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextProgress />
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
