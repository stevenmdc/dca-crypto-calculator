'use client';

import { useState, useCallback } from 'react';
import { CryptoType, FormInputs, CalculationResult } from '@/types';
import { Logo } from '@/components/Sidebar/Logo';
import { CryptoSelector } from '@/components/Sidebar/CryptoSelector';
import { InputField } from '@/components/Sidebar/InputField';
import { DatePicker } from '@/components/Sidebar/DatePicker';
import { CalculateButton } from '@/components/Sidebar/CalculateButton';
import { SummaryCard } from '@/components/Summary/SummaryCard';
import { DCAChart } from '@/components/Chart/DCAChart';
import { fetchHistoricalPrices } from '@/lib/priceApi';
import { calculateDCA, prepareChartData, calculateMetrics } from '@/lib/dcaCalculator';
import { validateFormInputs, dateToISOString, getDefaultStartDate, getDefaultEndDate } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

export default function Home() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('bitcoin');
  const [initialCapital, setInitialCapital] = useState(100);
  const [monthlyAddition, setMonthlyAddition] = useState(50);
  const [startDate, setStartDate] = useState(dateToISOString(getDefaultStartDate()));
  const [endDate, setEndDate] = useState(dateToISOString(getDefaultEndDate()));
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const formInputs: FormInputs = {
        crypto: selectedCrypto,
        initialCapital,
        monthlyAddition,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      };

      // Validate inputs
      const validation = validateFormInputs(formInputs);
      if (!validation.valid) {
        setError(validation.errors[0]);
        setIsLoading(false);
        return;
      }

      // Fetch historical prices
      const prices = await fetchHistoricalPrices(
        selectedCrypto,
        formInputs.startDate,
        formInputs.endDate
      );

      if (prices.length === 0) {
        setError('Aucune données de prix disponibles pour cette période');
        setIsLoading(false);
        return;
      }

      // Calculate DCA
      const dcaResult = calculateDCA(
        initialCapital,
        monthlyAddition,
        formInputs.startDate,
        formInputs.endDate,
        prices
      );

      // Prepare chart data
      const chartData = prepareChartData(
        dcaResult.dates,
        dcaResult.portfolioValues,
        dcaResult.investedCapital
      );

      // Calculate metrics
      const finalValue = dcaResult.portfolioValues[dcaResult.portfolioValues.length - 1] || 0;
      const totalInvested = dcaResult.investedCapital[dcaResult.investedCapital.length - 1] || 0;
      const metrics = calculateMetrics(totalInvested, finalValue);

      setResult({
        ...metrics,
        chartData,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Une erreur s\'est produite lors du calcul'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrypto, initialCapital, monthlyAddition, startDate, endDate]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Sidebar */}
        <aside className="lg:w-80 lg:sticky lg:top-8 h-fit">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-6">
            <Logo />
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Paramètres</h2>
              <CryptoSelector
                selectedCrypto={selectedCrypto}
                onSelectCrypto={setSelectedCrypto}
              />
            </div>

            <div className="space-y-4">
              <InputField
                label="Capital initial (€)"
                value={initialCapital}
                onChange={setInitialCapital}
                icon={DollarSign}
                min={0}
                step={100}
              />
              <InputField
                label="Ajout mensuel (€)"
                value={monthlyAddition}
                onChange={setMonthlyAddition}
                icon={DollarSign}
                min={0}
                step={10}
              />
            </div>

            <div className="space-y-4">
              <DatePicker
                label="Date de début"
                value={startDate}
                onChange={setStartDate}
                min="2022-01-01"
                max={endDate}
              />
              <DatePicker
                label="Date de fin"
                value={endDate}
                onChange={setEndDate}
                min={startDate}
                max={dateToISOString(getDefaultEndDate())}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <CalculateButton
              onClick={handleCalculate}
              isLoading={isLoading}
              isDisabled={initialCapital < 0 || monthlyAddition < 0}
            />
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 space-y-6">
          <DCAChart
            data={result?.chartData || []}
            isLoading={isLoading}
            cryptoType={selectedCrypto}
          />
          <SummaryCard result={result} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}
