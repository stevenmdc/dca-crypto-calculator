'use client';

import type { CalculationResult, Currency } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { MetricDisplay } from './MetricDisplay';

interface SummaryCardProps {
  result: CalculationResult | null;
  isLoading: boolean;
  currency: Currency;
}

export function SummaryCard({ result, isLoading, currency }: SummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-midnight-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-midnight-700 rounded animate-pulse w-1/3" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-midnight-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-midnight-800/50 border border-slate-700 rounded-lg p-6 text-center text-white">
        <p>Lancez une simulation pour voir les résultats</p>
      </div>
    );
  }

  const performanceColor =
    result.roiPercentage >= 0 ? 'positive' : 'negative';

  return (
    <div className="bg-midnight-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
      <div className="flex flex-wrap gap space-x-4">
        <MetricDisplay
          label="Valeur finale du portefeuille"
          value={formatCurrency(result.finalValue, currency)}
          subText={`+${result.roiPercentage.toFixed(2)}%`}
          variant="positive"
        />

        <MetricDisplay
          label="Capital total investi"
          value={formatCurrency(result.totalInvested, currency)}
        />

        <MetricDisplay
          label="Performance"
          value={formatCurrency(result.roi, currency)}
          subText={`${result.roiPercentage >= 0 ? '+' : ''}${result.roiPercentage.toFixed(2)}%`}
          variant={performanceColor}
        />
      </div>
    </div>
  );
}
