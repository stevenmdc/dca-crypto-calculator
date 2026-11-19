'use client';

import { useEffect, useState } from 'react';
import { CryptoType } from '@/types';
import { dateToISOString, getDefaultEndDate, getDefaultStartDate } from '@/lib/utils';
import { CalculatorSidebar } from '@/components/Sidebar/CalculatorSidebar';
import { ResultsSection } from '@/components/Results/ResultsSection';
import { useDcaCalculation } from '@/hooks/useDcaCalculation';

export default function Home() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('bitcoin');
  const [initialCapital, setInitialCapital] = useState(100);
  const [monthlyAddition, setMonthlyAddition] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxEndDate, setMaxEndDate] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const defaultEndDate = getDefaultEndDate();

      setStartDate(dateToISOString(getDefaultStartDate()));
      setEndDate(dateToISOString(defaultEndDate));
      setMaxEndDate(dateToISOString(defaultEndDate));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const { result, isLoading, error, handleCalculate } = useDcaCalculation({
    selectedCrypto,
    initialCapital,
    monthlyAddition,
    startDate,
    endDate,
  });

  return (
    <div className="min-h-screen bg-midnight mx-auto max-w-5xl">
      <div className="flex flex-col lg:flex-row gap-6 mx-auto p-4 sm:p-6 lg:p-8">
        <CalculatorSidebar
          selectedCrypto={selectedCrypto}
          onSelectCrypto={setSelectedCrypto}
          initialCapital={initialCapital}
          onInitialCapitalChange={setInitialCapital}
          monthlyAddition={monthlyAddition}
          onMonthlyAdditionChange={setMonthlyAddition}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          maxEndDate={maxEndDate}
          error={error}
          isLoading={isLoading}
          onCalculate={handleCalculate}
        />
        <ResultsSection
          result={result}
          isLoading={isLoading}
          selectedCrypto={selectedCrypto}
          initialCapital={initialCapital}
          monthlyAddition={monthlyAddition}
        />
      </div>
    </div>
  );
}
