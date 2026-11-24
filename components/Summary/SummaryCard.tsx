'use client';

import type { CalculationResult, CryptoType, Currency } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { CalculationTooltip } from './CalculationTooltip';
import { MetricDisplay } from './MetricDisplay';

interface SummaryCardProps {
  result: CalculationResult | null;
  isLoading: boolean;
  selectedCrypto: CryptoType;
  currency: Currency;
}

export function SummaryCard({ result, isLoading, selectedCrypto, currency }: SummaryCardProps) {
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
  const performance = formatPercentage(result.roiPercentage);
  const dipPurchases = result.method?.strategy.type === 'buy-the-dip' ? result.method.contributionCount : undefined;

  return (
    <div className={`relative rounded-lg border border-slate-700 bg-midnight-800/50 p-6 ${result.method ? 'pr-12' : ''}`}>
      {result.method && (
        <CalculationTooltip result={result} method={result.method} selectedCrypto={selectedCrypto} currency={currency} />
      )}
      <div className="flex flex-wrap gap-x-4">
        <MetricDisplay
          label="Valeur finale du portefeuille"
          value={formatCurrency(result.finalValue, currency)}
          subText={performance}
          variant="positive"
        />

        <MetricDisplay
          label="Capital total investi"
          value={formatCurrency(result.totalInvested, currency)}
          subText={dipPurchases === undefined ? undefined : `${dipPurchases} achat${dipPurchases > 1 ? 's' : ''} sur baisse`}
        />

        <MetricDisplay
          label="Performance"
          value={formatCurrency(result.roi, currency)}
          subText={performance}
          variant={performanceColor}
        />
      </div>
    </div>
  );
}
