'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Package } from 'lucide-react';

interface BottleProductionPieChartProps {
  selectedCenterId?: number | null;
  period?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface BottleData {
  type: string;
  quantity: number;
  tonnage: number;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#823c16ff', // brown
  '#f97316', // orange
];

export default function BottleProductionPieChart({ selectedCenterId, period, dateFrom, dateTo }: BottleProductionPieChartProps) {
  const [bottleData, setBottleData] = useState<BottleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBottleData();
  }, [selectedCenterId, period, dateFrom, dateTo]);

  const fetchBottleData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCenterId) params.set('centerId', selectedCenterId.toString());
      if (dateFrom) {
        params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
      } else if (period) {
        params.set('period', period);
      } else {
        params.set('period', 'month');
      }

      const response = await fetch(`/api/production/bottle-stats?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBottleData(data);
      }
    } catch (error) {
      console.error('Error fetching bottle data:', error);
      setBottleData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatBottleName = (name: string): string => {
    return name.replace(/_/g, '.');
  };

  const chartData = bottleData.map((bottle) => ({
    name: formatBottleName(bottle.type),
    value: bottle.tonnage,
    quantity: bottle.quantity,
  }));

  const totalTonnage = bottleData.reduce((sum, bottle) => sum + bottle.tonnage, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Tonnage:</span>{' '}
            <span className="font-medium">{payload[0].value.toFixed(3)} T</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Quantité:</span>{' '}
            <span className="font-medium">{payload[0].payload.quantity.toLocaleString()}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Part:</span>{' '}
            <span className="font-medium">
              {((payload[0].value / totalTonnage) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Production par Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bouteilles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucune donnée de production disponible</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend className='text-xs' />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-row items-center justify-center gap-3 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Types</p>
                <p className="text-xl font-bold">{chartData.length}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
