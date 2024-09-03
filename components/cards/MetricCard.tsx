// components/MetricCard.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from '../ui/badge';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  footer?: string;
  loading?: boolean;
  trend?: number;
}

export function MetricCard({ title, value, icon, footer, loading = false, trend }: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    return trend >= 0 ? 
      <TrendingUp className="h-4 w-4 text-primary" /> : 
      <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return '';
    return trend >= 0 ? 'text-primary bg-primary/30' : 'text-destructive bg-destructive/30';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {loading ? <Skeleton className="h-5 w-40 rounded-sm" /> : title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="h-8 w-12 mb-2 rounded-sm" />
            {footer && <Skeleton className="h-3 w-32 rounded-sm" />}
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{value}</div>
              
            </div>
            {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
            {trend !== undefined && (
              <div className={`flex flex-row gap-1 text-xs ${getTrendColor()}`}>
                
                <Badge className='w-fit bg-red-300/15 gap-1 text-destructive'>{getTrendIcon()} {trend >= 0 ? '+' : ''}{trend}%</Badge>
                {/* {trend >= 0 ? '+' : ''}{trend}% sur le mois précédent */}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}