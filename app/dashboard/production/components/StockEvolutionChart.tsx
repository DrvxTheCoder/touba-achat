'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

type TimeFilter = 'week' | 'month' | 'quarter' | 'year';

interface StockEvolutionChartProps {
  selectedCenterId?: number | null;
}

interface ChartData {
  date: string;
  stockPhysique: number;
  stockTheorique: number;
  ecart: number;
}

export default function StockEvolutionChart({ selectedCenterId }: StockEvolutionChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [timeFilter, selectedCenterId]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const url = selectedCenterId
        ? `/api/production/stock-evolution?period=${timeFilter}&centerId=${selectedCenterId}`
        : `/api/production/stock-evolution?period=${timeFilter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (timeFilter === 'week' || timeFilter === 'month') {
      return format(date, 'dd MMM', { locale: fr });
    } else if (timeFilter === 'quarter') {
      return format(date, 'dd MMM', { locale: fr });
    } else {
      return format(date, 'MMM yyyy', { locale: fr });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const stockPhysique = payload.find((p: any) => p.dataKey === 'stockPhysique');
      const stockTheorique = payload.find((p: any) => p.dataKey === 'stockTheorique');
      const ecart = payload.find((p: any) => p.dataKey === 'ecart');

      return (
        <div className="bg-background border rounded-lg shadow-lg p-4">
          <p className="font-semibold mb-2">{formatDate(label)}</p>
          <div className="space-y-1 text-sm">
            {stockPhysique && (
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-muted-foreground">Stock Physique:</span>
                <span className="font-medium">{stockPhysique.value.toFixed(2)} T</span>
              </p>
            )}
            {stockTheorique && (
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-muted-foreground">Stock Théorique:</span>
                <span className="font-medium">{stockTheorique.value.toFixed(2)} T</span>
              </p>
            )}
            {ecart && (
              <p className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span className="text-muted-foreground">Écart:</span>
                <span className="font-medium">{ecart.value.toFixed(2)} T</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Évolution du Stock Physique</CardTitle>
            <CardDescription>Comparaison stock physique vs théorique</CardDescription>
          </div>
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Chargement des données...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Aucune donnée disponible</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aucun inventaire complété pour cette période
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tickFormatter={formatDate} className="text-xs" />
              <YAxis
                className="text-xs"
                label={{ value: 'Tonnes (T)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    stockPhysique: 'Stock Physique',
                    stockTheorique: 'Stock Théorique',
                    ecart: 'Écart',
                  };
                  return labels[value] || value;
                }}
              />

              <Bar
                dataKey="stockPhysique"
                fill="#3b82f6"
                stroke="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="stockTheorique"
                fill="#10b981"
                stroke="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

        )}
      </CardContent>
    </Card>
  );
}
