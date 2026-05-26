"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, LogOut, DoorOpen } from "lucide-react";
import { SpinnerCircular } from "spinners-react";

interface BDSMetrics {
  total: number;
  submitted: number;
  validated: number;
  completed: number;
}

interface BDSKPICardsProps {
  timeRange: string;
  type: string;
}

export function BDSKPICards({ timeRange, type }: BDSKPICardsProps) {
  const [metrics, setMetrics] = useState<BDSMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ timeRange: timeRange || "this-month" });
        if (type && type !== "all") params.append("type", type);
        const res = await fetch(`/api/dashboard/bds-data?${params}`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error("Error fetching BDS metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange, type]);

  const cards = [
    { label: "Total", value: metrics?.total ?? 0, icon: FileText, color: "text-primary" },
    { label: "Soumis", value: metrics?.submitted ?? 0, icon: Clock, color: "text-blue-500" },
    { label: "Validé", value: metrics?.validated ?? 0, icon: CheckCircle, color: "text-green-500" },
    { label: "Sorti", value: metrics?.completed ?? 0, icon: DoorOpen, color: "text-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="py-3">
          <CardContent className="p-0 px-4 flex flex-row items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {isLoading ? (
                <SpinnerCircular size={20} thickness={100} speed={100} color="#36ad47" secondaryColor="rgba(73, 172, 57, 0.23)" />
              ) : (
                <p className="text-xl font-bold">{value}</p>
              )}
            </div>
            <Icon className={`h-5 w-5 ${color}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
