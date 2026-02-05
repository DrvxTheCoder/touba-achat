'use client';

import { Suspense, useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProductionList from './ProductionList';
import { ProductionStart } from './ProductionStart';
import CenterSwitcher from './CenterSwitcher';
import ProductionMetrics from './ProductionMetrics';
import StockEvolutionChart from './StockEvolutionChart';
import BottleProductionPieChart from './BottleProductionPieChart';
import { DatePickerWithRange } from '@/components/DatePickerWithRange';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Settings,
  CalendarCheck,
  CalendarDays,
  Calendar,
  CalendarRange,
  CalendarClock,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TimePreset = 'day' | 'week' | 'month' | 'trimester' | 'year';

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

const PRESETS: { value: TimePreset; label: string; icon: typeof Calendar }[] = [
  { value: 'day', label: 'Jour', icon: CalendarCheck },
  { value: 'week', label: 'Semaine', icon: CalendarDays },
  { value: 'month', label: 'Mois', icon: Calendar },
  { value: 'trimester', label: 'Trimestre', icon: CalendarRange },
  { value: 'year', label: 'Année', icon: CalendarClock },
];

export default function ProductionPageClient({
  canCreate,
  canView,
  isAdmin,
}: ProductionPageClientProps) {
  const [selectedCenter, setSelectedCenter] = useState<ProductionCenter | null>(null);
  const [timePreset, setTimePreset] = useState<TimePreset>('month');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Compute filter params to pass to child components
  const filterParams = useMemo(() => {
    if (dateRange?.from) {
      const dateFrom = format(dateRange.from, 'yyyy-MM-dd');
      const dateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
      return { dateFrom, dateTo, period: undefined };
    }
    return { dateFrom: undefined, dateTo: undefined, period: timePreset };
  }, [timePreset, dateRange]);

  const hasActiveCustomRange = !!dateRange?.from;

  const handlePresetChange = (preset: TimePreset) => {
    setTimePreset(preset);
    setDateRange(undefined);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const handleClearFilters = () => {
    setTimePreset('month');
    setDateRange(undefined);
  };

  // Current filter label for display
  const filterLabel = useMemo(() => {
    if (dateRange?.from) {
      if (dateRange.to) {
        return `${format(dateRange.from, 'dd MMM', { locale: fr })} - ${format(dateRange.to, 'dd MMM yyyy', { locale: fr })}`;
      }
      return format(dateRange.from, 'dd MMM yyyy', { locale: fr });
    }
    const labels: Record<TimePreset, string> = {
      day: 'Dernier inventaire',
      week: 'Cette semaine',
      month: 'Ce mois',
      trimester: 'Ce trimestre',
      year: 'Cette année',
    };
    return labels[timePreset];
  }, [timePreset, dateRange]);

  return (
    <TooltipProvider>
      <main className="px-4 sm:px-8 mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 mb-80">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Production GPL</h1>
            <p className="text-sm text-muted-foreground">
              Suivi de la production de gaz
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <CenterSwitcher
              onCenterChange={(center) => setSelectedCenter(center)}
              className="flex-1 sm:flex-none"
            />

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
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

        {/* Filter Bar */}
        {canView && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Time Preset Buttons */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {PRESETS.map(({ value, label, icon: Icon }) => (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={timePreset === value && !hasActiveCustomRange ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 px-2 sm:px-3"
                      onClick={() => handlePresetChange(value)}
                    >
                      <Icon className="h-4 w-4 sm:mr-1.5" />
                      <span className="hidden sm:inline text-xs">{label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Date Range Picker */}
            <div className="w-auto">
              <DatePickerWithRange
                value={dateRange}
                onChange={handleDateRangeChange}
                className="w-auto"
              />
            </div>

            {/* Clear Filters */}
            {(hasActiveCustomRange || timePreset !== 'month') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                    onClick={handleClearFilters}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Réinitialiser les filtres</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Active Filter Label */}
            <span className="text-xs text-muted-foreground hidden sm:inline ml-1">
              {filterLabel}
            </span>
          </div>
        )}

        {/* Show selected center info */}
        {selectedCenter && (
          <div className="bg-muted/50 border rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Centre sélectionné</p>
                <p className="font-semibold text-sm sm:text-base">{selectedCenter.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCenter.address}</p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-muted-foreground">Chef de production</p>
                <p className="font-medium text-sm sm:text-base">{selectedCenter.chefProduction.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Production Metrics */}
        {canView && (
          <ProductionMetrics
            selectedCenterId={selectedCenter?.id}
            period={filterParams.period}
            dateFrom={filterParams.dateFrom}
            dateTo={filterParams.dateTo}
          />
        )}

        {/* Stock Evolution Chart and Bottle Production Pie Chart */}
        {canView && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <StockEvolutionChart
                selectedCenterId={selectedCenter?.id}
                period={filterParams.period}
                dateFrom={filterParams.dateFrom}
                dateTo={filterParams.dateTo}
              />
            </div>
            <div className="lg:col-span-1">
              <BottleProductionPieChart
                selectedCenterId={selectedCenter?.id}
                period={filterParams.period}
                dateFrom={filterParams.dateFrom}
                dateTo={filterParams.dateTo}
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {canCreate && (
            <Suspense fallback={<div>Chargement...</div>}>
              <ProductionStart selectedCenterId={selectedCenter?.id} />
            </Suspense>
          )}

          <Suspense fallback={<div>Chargement...</div>}>
            <ProductionList selectedCenterId={selectedCenter?.id} isAdmin={isAdmin} />
          </Suspense>
        </div>
      </main>
    </TooltipProvider>
  );
}
