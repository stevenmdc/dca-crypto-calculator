'use client';

import { CalculationResult } from '@/types';
import { MetricDisplay } from './MetricDisplay';
import { TrendingUp, DollarSign, Target } from 'lucide-react';

interface SummaryCardProps {
  result: CalculationResult | null;
  isLoading: boolean;
}

export function SummaryCard({ result, isLoading }: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-slate-700 rounded animate-pulse w-1/3" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        <p>Lancez une simulation pour voir les résultats</p>
      </div>
    );
  }

  const performanceColor =
    result.roiPercentage >= 0 ? 'positive' : 'negative';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-white">Résumé</h2>

      <div className="space-y-4">
        <MetricDisplay
          label="Valeur finale du portefeuille"
          value={`€${result.finalValue.toFixed(2)}`}
          icon={TrendingUp}
          subText={`+${result.roiPercentage.toFixed(2)}%`}
          variant="positive"
        />

        <MetricDisplay
          label="Capital total investi"
          value={`€${result.totalInvested.toFixed(2)}`}
          icon={DollarSign}
        />

        <MetricDisplay
          label="Performance"
          value={`€${result.roi.toFixed(2)}`}
          icon={Target}
          subText={`${result.roiPercentage >= 0 ? '+' : ''}${result.roiPercentage.toFixed(2)}%`}
          variant={performanceColor}
        />
      </div>
    </div>
  );
}
