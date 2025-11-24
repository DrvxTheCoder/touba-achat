'use client';

import { Suspense, useState } from 'react';
import ProductionList from './ProductionList';
import { ProductionStart } from './ProductionStart';
import { ProductionDashboard } from './ProductionDashboard';
import CenterSwitcher from './CenterSwitcher';
import ProductionMetrics from './ProductionMetrics';
import StockEvolutionChart from './StockEvolutionChart';
import ReservoirStockCard from './ReservoirStockCard';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProductionCenter {
  id: number;
  name: string;
  address: string;
  chefProduction: {
    id: number;
    name: string;
    email: string;
  };
}

interface ProductionPageClientProps {
  canCreate: boolean;
  canView: boolean;
  isAdmin: boolean;
}

export default function ProductionPageClient({
  canCreate,
  canView,
  isAdmin,
}: ProductionPageClientProps) {
  const [selectedCenter, setSelectedCenter] = useState<ProductionCenter | null>(null);

  return (
    <main className="px-8 mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Production GPL</h1>
          <p className="text-muted-foreground">
            Suivi journalier de la production de gaz
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Center Switcher */}
          <CenterSwitcher
            onCenterChange={(center) => setSelectedCenter(center)}
            className="flex-1 sm:flex-none"
          />

          {/* Settings Dropdown */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Configuration</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/production/settings/bottle-types">
                    Types de bouteilles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/production/settings/centers">
                    Centres de production
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/production/settings/reservoirs">
                    Réservoirs GPL
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Show selected center info */}
      {selectedCenter && (
        <div className="bg-muted/50 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Centre sélectionné</p>
              <p className="font-semibold">{selectedCenter.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCenter.address}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Chef de production</p>
              <p className="font-medium">{selectedCenter.chefProduction.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Production Metrics */}
      {canView && (
        <ProductionMetrics selectedCenterId={selectedCenter?.id} />
      )}

      {/* Stock Evolution Chart and Reservoir Stock */}
      {canView && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StockEvolutionChart selectedCenterId={selectedCenter?.id} />
          </div>
          <div className="lg:col-span-1">
            <ReservoirStockCard selectedCenterId={selectedCenter?.id} />
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {canCreate && (
          <Suspense fallback={<div>Chargement...</div>}>
            <ProductionStart selectedCenterId={selectedCenter?.id} />
          </Suspense>
        )}

        {/* {canView && (
          <Suspense fallback={<div>Chargement...</div>}>
            <ProductionDashboard selectedCenterId={selectedCenter?.id} />
          </Suspense>
        )} */}
      <Suspense fallback={<div>Chargement...</div>}>
        <ProductionList selectedCenterId={selectedCenter?.id} />
      </Suspense>
      </div>


    </main>
  );
}
