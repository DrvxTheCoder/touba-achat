"use client"
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"
import NextProgress from '@/components/next-progress';
import useRequireAuth from '../hooks/use-require-auth';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ChevronRight, Slash } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
  }

export default function DashboardLayout({ children }: DashboardLayoutProps)  {
  const { isAuthenticated, loading } = useRequireAuth();

  if (loading) {
    // Render a loading indicator or return null to render nothing
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }


  return (
      <>
        <div key="1" className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col">
              <Header />
              <Breadcrumb className='p-4'>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Acceuil</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Liens</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Toaster />
              {/* <NextProgress /> */}
              {children}
            </div>
        </div>
      </>
  );
}
