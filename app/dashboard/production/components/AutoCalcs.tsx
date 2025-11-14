// app/dashboard/production/[id]/ProductionForm/AutoCalcs.tsx
'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface AutoCalcsProps {
  stockInitial: number;
  butanier: number;
  recuperation: number;
  approSAR: number;
  ngabou: number;
  exports: number;
  divers: number;
  remplissageTotal: number;
  stockFinalTheorique: number;
  stockFinalPhysique: number;
  ecart: number;
  ecartPourcentage: number;
}

export default function AutoCalcs({
  stockInitial,
  butanier,
  recuperation,
  approSAR,
  ngabou,
  exports,
  divers,
  remplissageTotal,
  stockFinalTheorique,
  stockFinalPhysique,
  ecart,
  ecartPourcentage
}: AutoCalcsProps) {
  const totalEntrees = butanier + recuperation + approSAR;
  const totalSorties = ngabou + exports + divers + remplissageTotal;
  
  const ecartStatus = Math.abs(ecartPourcentage) <= 2 
    ? 'excellent' 
    : Math.abs(ecartPourcentage) <= 5 
    ? 'bon' 
    : 'attention';

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Calculs automatiques</h3>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stock initial */}
        <Card className="p-4 bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">Stock initial</div>
          <div className="text-2xl font-bold">{stockInitial.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">tonnes</div>
        </Card>

        {/* Total entrées */}
        <Card className="p-4 bg-green-50 dark:bg-green-950/30">
          <div className="text-xs text-muted-foreground mb-1">Total entrées</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{totalEntrees.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            {butanier.toFixed(0)} + {recuperation.toFixed(0)} + {approSAR.toFixed(0)}
          </div>
        </Card>

        {/* Total sorties */}
        <Card className="p-4 bg-red-50 dark:bg-red-950/30">
          <div className="text-xs text-muted-foreground mb-1">Total sorties</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            -{totalSorties.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            {ngabou.toFixed(2)} + {exports.toFixed(2)} + {divers.toFixed(2)} + {remplissageTotal.toFixed(3)}
          </div>
        </Card>

        {/* Remplissage total */}
        <Card className="p-4 bg-primary/10">
          <div className="text-xs text-muted-foreground mb-1">Production totale</div>
          <div className="text-2xl font-bold text-primary">
            {remplissageTotal.toFixed(3)}
          </div>
          <div className="text-xs text-muted-foreground">tonnes</div>
        </Card>
      </div>

      {/* Stocks finaux et écart */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/30">
          <div className="text-xs text-muted-foreground mb-1">
            Stock final théorique
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stockFinalTheorique.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Calculé automatiquement
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 dark:bg-purple-950/30">
          <div className="text-xs text-muted-foreground mb-1">
            Stock final physique
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {(stockFinalPhysique || 0).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Somme des sphères
          </div>
        </Card>

        <Card className={`p-4 ${
          ecartStatus === 'excellent' 
            ? 'bg-green-50 dark:bg-green-950/30' 
            : ecartStatus === 'bon'
            ? 'bg-yellow-50 dark:bg-yellow-950/30'
            : 'bg-red-50 dark:bg-red-950/30'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-muted-foreground">Écart</div>
            {ecartStatus === 'excellent' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : ecartStatus === 'bon' ? (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className={`text-3xl font-bold ${
            ecartStatus === 'excellent' 
              ? 'text-green-600 dark:text-green-400' 
              : ecartStatus === 'bon'
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {ecart > 0 ? '+' : ''}{ecart.toFixed(2)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {ecart > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="text-xs font-semibold">
              {ecartPourcentage > 0 ? '+' : ''}{ecartPourcentage.toFixed(2)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Formule explicative */}
      <Card className="p-4 mt-6 bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-2">
          <div className="font-semibold">Formule de calcul:</div>
          <div className="font-mono text-xs">
            Stock Final Théorique = Stock Initial + Butanier + Récupération + Appro SAR - NGABOU - Exports - Divers - Production Totale
          </div>
          <div className="font-mono text-xs">
            Écart = Stock Final Physique - Stock Final Théorique
          </div>
          <div className="mt-3 pt-3 border-t">
            <div>✓ Écart ≤ 2%: Excellent</div>
            <div>⚠ Écart 2-5%: Acceptable</div>
            <div>✗ Écart {'>'} 5%: Attention requise</div>
          </div>
        </div>
      </Card>
    </Card>
  );
}