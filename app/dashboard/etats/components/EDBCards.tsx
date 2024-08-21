"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageIcon, Clock, AlertTriangle } from "lucide-react";
import MetricCard from './metricCard';
import { MetricCardSkeleton } from './skeletons/MetricCardSkeleton';
import { StatCardSkeleton } from './skeletons/StatCardSkeleton';
import { Button } from '@/components/ui/button';

interface AggregatedData {
  total: number;
  active: number;
  pending: number;
  percentageChange: string;
  lastHourActive: number;
}

export function EDBCards() {
  const [data, setData] = useState<AggregatedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/edb-data');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        const result = await response.json();
        setData(result.aggregatedData);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <MetricCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
    <div>
        <Card>
            <CardContent className="p-6 text-sm text-center text-muted-foreground">
                <Button variant={null} className="bg-none hover:bg-none cursor-default"><AlertTriangle /></Button>
                <div>Une erreur s&apos;est produite lors du calcul des métriques.</div>
            </CardContent>
        </Card>
    </div>);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      <MetricCard />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total
          </CardTitle>
          <PackageIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total}</div>
          <p className="text-xs text-muted-foreground">
            +{data.percentageChange}% sur le mois dernier
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Actif
          </CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{data.active}</div>
          <p className="text-xs text-muted-foreground">
          +{data.lastHourActive} depuis la dernière heure
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Attente</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.pending}</div>
        </CardContent>
      </Card>
    </div>
  );
}