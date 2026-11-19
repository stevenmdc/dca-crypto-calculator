'use client';

import { useCallback, useRef, useState } from 'react';
import type { CalculationResult, ContributionFrequency, CryptoType, Currency, FormInputs } from '@/types';
import { fetchHistoricalPrices } from '@/lib/priceApi';
import { calculateDCA, calculateMetrics, prepareChartData } from '@/lib/dcaCalculator';
import { dateFromISOString, validateFormInputs } from '@/lib/utils';

interface UseDcaCalculationParams {
  selectedCrypto: CryptoType;
  currency: Currency;
  initialCapital: number;
  contribution: number;
  frequency: ContributionFrequency;
  startDate: string;
  endDate: string;
}

export function useDcaCalculation({
  selectedCrypto,
  currency,
  initialCapital,
  contribution,
  frequency,
  startDate,
  endDate,
}: UseDcaCalculationParams) {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  const resetCalculation = () => {
    runId.current++;
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  const handleCalculate = useCallback(async () => {
    const currentRun = ++runId.current;
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const formInputs: FormInputs = {
        crypto: selectedCrypto,
        initialCapital,
        contribution,
        startDate: dateFromISOString(startDate),
        endDate: dateFromISOString(endDate),
      };

      const validation = validateFormInputs(formInputs);
      if (!validation.valid) {
        setError(validation.errors[0]);
        return;
      }

      const prices = await fetchHistoricalPrices(
        selectedCrypto,
        formInputs.startDate,
        formInputs.endDate,
        currency,
      );
      if (runId.current !== currentRun) return;

      if (prices.length === 0) {
        setError('Aucune donnée de prix disponible pour cette période');
        return;
      }

      const dcaResult = calculateDCA(
        initialCapital,
        contribution,
        formInputs.startDate,
        formInputs.endDate,
        prices,
        { frequency, dailyValuations: true },
      );

      const chartData = prepareChartData(
        dcaResult.dates,
        dcaResult.portfolioValues,
        dcaResult.investedCapital,
        dcaResult.cryptoQuantity,
      );

      const finalValue = dcaResult.portfolioValues[dcaResult.portfolioValues.length - 1] || 0;
      const totalInvested = dcaResult.investedCapital[dcaResult.investedCapital.length - 1] || 0;
      const metrics = calculateMetrics(totalInvested, finalValue);

      const finalQuantity = dcaResult.cryptoQuantity[dcaResult.cryptoQuantity.length - 1] || 0;
      const initialPrice = dcaResult.prices[0] || 0;
      const finalPrice = dcaResult.prices[dcaResult.prices.length - 1] || 0;
      setResult({
        ...metrics,
        chartData,
        method: {
          initialCapital,
          contribution,
          frequency,
          initialPrice,
          finalPrice,
          totalCryptoQuantity: finalQuantity,
          contributionCount: dcaResult.contributionCount,
        },
      });
    } catch (err) {
      if (runId.current === currentRun) {
        setError(err instanceof Error ? err.message : 'Une erreur s\'est produite lors du calcul');
      }
    } finally {
      if (runId.current === currentRun) setIsLoading(false);
    }
  }, [selectedCrypto, currency, initialCapital, contribution, frequency, startDate, endDate]);

  return {
    result,
    isLoading,
    error,
    handleCalculate,
    resetCalculation,
  };
}
