import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FilePlus2, 
  FileText, 
  PackagePlus, 
  FileSpreadsheet, 
  Store, 
  Package2, 
  LuggageIcon, 
  RefreshCcw, 
  LogOutIcon,
  Settings,
  Users,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Category } from '@prisma/client';
import UserStockEdbFormTwo from '../../etats-de-besoin/components/UserStockEDBFormTwo';

// Types for our metrics
type MetricCardProps = {
  title: string;
  value: number | undefined;
  description?: string;
  action?: React.ReactNode;
  icon: React.ReactNode;
}

type CardActionButtonProps = {
  title: string;
  action: React.ReactNode;
}

const MetricCard = ({ title, value, description, icon, action }: MetricCardProps) => (
  <Card className="flex items-center min-h-32 rounded-2xl">
    <CardContent className="flex flex-row justify-between items-center p-3 px-6 gap-2 w-full">
      <div className="flex flex-row items-center gap-4 md:gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border">
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <h5 className="text-sm font-semibold leading-5">
            {title}
          </h5>
          <p className="mt-1 text-2xl font-bold leading-6">
            {value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>
      <div className="flex">
        {action}
      </div>
    </CardContent>
  </Card>
);

const CardActionButton = ({ title, action }: CardActionButtonProps) => (
  <Card className="flex items-center min-h-32 rounded-2xl">
    <CardContent className="flex flex-row justify-between items-center p-3 px-6 gap-2 w-full">
      <div className="flex flex-row items-center gap-4 md:gap-6">
        <div className="flex flex-col gap-1">
          <p className="mt-1 text-lg font-bold leading-6">
            {title}
          </p>
        </div>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-full border hover:bg-primary hover:text-white cursor-pointer">
        {action}
      </div>
    </CardContent>
  </Card>
);

const DashboardMetrics = () => {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();

  const [categories, setCategories] = React.useState<Category[]>([]);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const [metrics, setMetrics] = React.useState<{
    stockEdbs: { total: number; percentageChange: number };
    standardEdbs: { total: number; percentageChange: number };
    activeOdms: { total: number; percentageChange: number };
  }>({
    stockEdbs: { total: 0, percentageChange: 0 },
    standardEdbs: { total: 0, percentageChange: 0 },
    activeOdms: { total: 0, percentageChange: 0 },
  });
  
  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics');
        if (!response.ok) throw new Error('Erreur réseau');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };
  
    fetchMetrics();
  }, []);

  const handleStockEdbSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/edb/stock/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create stock EDB');
      }

      const result = await response.json();
      toast.success("Demande stock crée", {
        description: `La demande ${result.edbId} a été crée avec succès.`,
        action: {
          label: 'Voir',
          onClick: () => router.push('/etats-de-besoin')
        },
      });
    } catch (error) {
      console.error('Error creating stock EDB:', error);
      toast.error("Erreur", {
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de la demande stock.",
      });
    }
  };

  const renderMetricsByRole = () => {
    switch (role) {
      case 'MAGASINIER':
      case 'ADMIN':
        return (
          <>
          <MetricCard
            title="Total EDBs (Stock)"
            value={metrics.stockEdbs.total}
            description={`${Math.ceil(metrics.stockEdbs.percentageChange)}% sur le mois dernier`}
            icon={<Store className="h-8 w-8 text-muted-foreground" />}
            action={<Link href={'/dashboard/etats/stock'}><Button variant={"outline"} className="h-8"> Gerer </Button></Link>}
          />
          <MetricCard
            title="Total EDBs (Standard)"
            value={metrics.standardEdbs.total}
            icon={<Package2 className="h-8 w-8 text-muted-foreground" />}
            action={<Link href={'/dashboard/etats'}><Button variant={"outline"} className="h-8"> Gerer </Button></Link>}
          />
          <MetricCard
            title="Total ODMs"
            value={metrics.activeOdms.total}
            description={`${Math.ceil(metrics.activeOdms.percentageChange)}% sur le mois dernier`}
            icon={<LuggageIcon className="h-8 w-8 text-muted-foreground" />}
            action={<Link href={'/dashboard/odm'}><Button variant={"outline"} className="h-8"> Gerer </Button></Link>}
          />
          <CardActionButton 
            title="Creer un EDB (Stock)"
            action={
            <UserStockEdbFormTwo 
              categories={categories}
              onSubmit={handleStockEdbSubmit}
            />
            }
          />
        </>
        );

      case 'USER':
        return (
          <>
            <MetricCard
              title="Total EDBs (Stock)"
              value={metrics.stockEdbs.total}
              description={`${metrics.stockEdbs.percentageChange}% sur le mois dernier`}
              icon={<PackagePlus className="h-8 w-8 text-muted-foreground" />}
              action={<Link href="/etats-de-besoin"><Button variant="outline" className="h-8">Gérer</Button></Link>}
            />
            <MetricCard
              title="EDBs Convertis"
              value={metrics.standardEdbs.total}
              description="EDBs (stock) convertis"
              icon={<RefreshCcw className="h-8 w-8 text-muted-foreground" />} 
            />
            <CardActionButton 
              title="Créer un EDB (Stock)"
              action={
                <UserStockEdbFormTwo 
                  categories={categories}
                  onSubmit={handleStockEdbSubmit}
                />
              }
            />
            <CardActionButton 
              title="Déconnexion"
              action={<LogOutIcon onClick={() => signOut()} className="h-8 w-8" />}
            />
          </>
        );

      default:
        return (
          <>
            <MetricCard
              title="Total EDBs (Stock)"
              value={metrics.stockEdbs.total}
              description={`${Math.ceil(metrics.stockEdbs.percentageChange)}% sur le mois dernier`}
              icon={<Store className="h-8 w-8 text-muted-foreground" />}
              action={<Link href="/etats-de-besoin"><Button variant="outline" className="h-8">Gérer</Button></Link>}
            />
            <MetricCard
              title="Total EDBs (Standard)"
              value={metrics.standardEdbs.total}
              icon={<Package2 className="h-8 w-8 text-muted-foreground" />}
              action={<Link href="/dashboard/etats"><Button variant="outline" className="h-8">Gérer</Button></Link>}
            />
            <MetricCard
              title="ODMs Actifs"
              value={metrics.activeOdms.total}
              description={`${Math.ceil(metrics.activeOdms.percentageChange)}% sur le mois dernier`}
              icon={<LuggageIcon className="h-8 w-8 text-muted-foreground" />}
              action={<Link href="/dashboard/odm"><Button variant="outline" className="h-8">Gérer</Button></Link>}
            />
            <CardActionButton 
              title="Créer un EDB (Stock)"
              action={
                <UserStockEdbFormTwo 
                  categories={categories}
                  onSubmit={handleStockEdbSubmit}
                />
              }
            />
          </>
        );
    }
  };

  return (
    <div className="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {renderMetricsByRole()}
    </div>
  );
};

export default DashboardMetrics;