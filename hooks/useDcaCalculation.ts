'use client';

import { useCallback, useRef, useState } from 'react';
import type { CalculationResult, CryptoType, Currency, FormInputs, InvestmentStrategy } from '@/types';
import { fetchHistoricalPrices } from '@/lib/priceApi';
import { calculateBuyTheDip, calculateDCA, calculateMetrics, prepareChartData } from '@/lib/dcaCalculator';
import { dateFromISOString, isValidDipThreshold, validateFormInputs } from '@/lib/utils';

interface UseDcaCalculationParams {
  selectedCrypto: CryptoType;
  currency: Currency;
  initialCapital: number;
  contribution: number;
  strategy: InvestmentStrategy;
  startDate: string;
  endDate: string;
}

export function useDcaCalculation({
  selectedCrypto,
  currency,
  initialCapital,
  contribution,
  strategy,
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

      if (strategy.type === 'buy-the-dip' && !isValidDipThreshold(strategy.dipThreshold)) {
        setError('Le seuil de baisse doit être supérieur à 0 % et inférieur à 100 %.');
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

      const { startDate: start, endDate: end } = formInputs;
      const simulation = strategy.type === 'dca'
        ? calculateDCA(initialCapital, contribution, start, end, prices, { frequency: strategy.frequency, dailyValuations: true })
        : calculateBuyTheDip(initialCapital, contribution, start, end, prices, strategy.dipThreshold);

      const chartData = prepareChartData(
        simulation.dates,
        simulation.portfolioValues,
        simulation.investedCapital,
        simulation.cryptoQuantity,
      );

      const finalValue = simulation.portfolioValues.at(-1) || 0;
      const totalInvested = simulation.investedCapital.at(-1) || 0;
      const metrics = calculateMetrics(totalInvested, finalValue);

      const finalQuantity = simulation.cryptoQuantity.at(-1) || 0;
      const initialPrice = simulation.prices[0] || 0;
      const finalPrice = simulation.prices.at(-1) || 0;
      setResult({
        ...metrics,
        chartData,
        method: {
          initialCapital,
          contribution,
          strategy,
          initialPrice,
          finalPrice,
          totalCryptoQuantity: finalQuantity,
          contributionCount: simulation.contributionCount,
        },
      });
    } catch (err) {
      if (runId.current === currentRun) {
        setError(err instanceof Error ? err.message : 'Une erreur s\'est produite lors du calcul');
      }
    } finally {
      if (runId.current === currentRun) setIsLoading(false);
    }
  }, [selectedCrypto, currency, initialCapital, contribution, strategy, startDate, endDate]);

  return {
    result,
    isLoading,
    error,
    handleCalculate,
    resetCalculation,
  };
}
