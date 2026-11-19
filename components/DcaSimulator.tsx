'use client';

import { useState } from 'react';
import type { ContributionFrequency, CryptoType, Currency, PriceCoverage } from '@/types';
import { addDays } from '@/lib/price-dates';
import { CalculatorSidebar } from '@/components/Sidebar/CalculatorSidebar';
import { ResultsSection } from '@/components/Results/ResultsSection';
import { useDcaCalculation } from '@/hooks/useDcaCalculation';

export function DcaSimulator({ history }: { history: Partial<Record<CryptoType, PriceCoverage>> }) {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('bitcoin');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [initialCapital, setInitialCapital] = useState(100);
  const [contribution, setContribution] = useState(50);
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [dates, setDates] = useState<{ startDate?: string; endDate?: string }>({});
  const coverage = history[selectedCrypto];
  const defaultStart = coverage ? addDays(coverage.lastDate, -365) : '';
  const startDate = coverage
    ? dates.startDate ?? (defaultStart < coverage.firstDate ? coverage.firstDate : defaultStart)
    : '';
  const endDate = coverage ? dates.endDate ?? coverage.lastDate : '';

  const { result, isLoading, error, handleCalculate, resetCalculation } = useDcaCalculation({
    selectedCrypto,
    currency,
    initialCapital,
    contribution,
    frequency,
    startDate,
    endDate,
  });

  return (
    <div className="min-h-screen bg-midnight mx-auto max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6 mx-auto p-4 sm:p-6 lg:p-8">
        <CalculatorSidebar
          selectedCrypto={selectedCrypto}
          onSelectCrypto={(crypto) => {
            if (crypto === selectedCrypto) return;
            const next = history[crypto];
            setSelectedCrypto(crypto);
            if (!next || startDate < next.firstDate || endDate > next.lastDate) setDates({});
            resetCalculation();
          }}
          currency={currency}
          onCurrencyChange={(next) => {
            if (next === currency) return;
            setCurrency(next);
            resetCalculation();
          }}
          initialCapital={initialCapital}
          onInitialCapitalChange={setInitialCapital}
          contribution={contribution}
          onContributionChange={setContribution}
          frequency={frequency}
          onFrequencyChange={(next) => {
            if (next === frequency) return;
            setFrequency(next);
            resetCalculation();
          }}
          startDate={startDate}
          onStartDateChange={(value) => setDates((current) => ({ ...current, startDate: value }))}
          endDate={endDate}
          onEndDateChange={(value) => setDates((current) => ({ ...current, endDate: value }))}
          coverage={coverage}
          error={error}
          isLoading={isLoading}
          onCalculate={handleCalculate}
        />
        <ResultsSection
          result={result}
          isLoading={isLoading}
          selectedCrypto={selectedCrypto}
          currency={currency}
        />
      </div>
    </div>
  );
}
