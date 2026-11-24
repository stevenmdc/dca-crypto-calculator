'use client';

import type { CalculationResult, CryptoType, Currency } from '@/types';
import { DCAChart } from '@/components/Chart/DCAChart';
import { SummaryCard } from '@/components/Summary/SummaryCard';

interface ResultsSectionProps {
  result: CalculationResult | null;
  isLoading: boolean;
  selectedCrypto: CryptoType;
  currency: Currency;
}

export function ResultsSection({
  result,
  isLoading,
  selectedCrypto,
  currency,
}: ResultsSectionProps) {
  return (
    <main className="min-w-0 flex-1 space-y-6">
      <DCAChart data={result?.chartData || []} isLoading={isLoading} cryptoType={selectedCrypto} currency={currency} />
      <SummaryCard result={result} isLoading={isLoading} selectedCrypto={selectedCrypto} currency={currency} />
    </main>
  );
}
