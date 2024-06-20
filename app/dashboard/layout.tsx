import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster"
import NextProgress from '@/components/next-progress';

export const metadata = {
  title: 'Touba Service Achat',
  description: 'L\'application Web Officiel du Service d\'Achat Touba Oil',
};
interface DashboardLayoutProps {
    children: React.ReactNode;
  }

export default function DashboardLayout({ children }: DashboardLayoutProps)  {

  return (
        <div key="1" className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <Sidebar />
            <div className="flex flex-col">
              <Header />
              <Toaster />
              <NextProgress />
              {children}
            </div>
        </div>
  );
}
