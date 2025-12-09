// app/dashboard/production/[id]/ProductionTimer.tsx
'use client';

import { Clock, Activity, TrendingUp } from 'lucide-react';
import { formatDuration } from '@/lib/types/production';

interface ProductionTimerProps {
  tempsTotal: number;
  totalArrets: number;
  rendement: number;
}

export default function ProductionTimer({
  tempsTotal,
  totalArrets,
  rendement
}: ProductionTimerProps) {
  const tempsProductif = tempsTotal - totalArrets;

  return (
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Temps total</div>
          <div className="text-2xl font-bold">{formatDuration(tempsTotal)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/10 rounded-lg">
          <Activity className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Arrêts</div>
          <div className="text-2xl font-bold">{formatDuration(totalArrets)}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-500/10 rounded-lg">
          <TrendingUp className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Rendement</div>
          <div className="text-2xl font-bold">{rendement.toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-4">
        <div>
          <div className="text-sm text-muted-foreground">Temps productif</div>
          <div className="text-lg font-semibold text-green-600">
            {formatDuration(tempsProductif)}
          </div>
        </div>
      </div>
    </div>
  );
}