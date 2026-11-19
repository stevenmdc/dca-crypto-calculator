'use client';

import { useState } from 'react';
import type { CalculationResult, CryptoType, Currency } from '@/types';
import { contributionFrequencyLabels, cryptoSymbols, formatCurrency } from '@/lib/utils';

interface CalculationMethodCardProps {
  result: CalculationResult | null;
  isLoading: boolean;
  selectedCrypto: CryptoType;
  currency: Currency;
}

function formatCrypto(value: number, symbol: string): string {
  return `${value.toFixed(8)} ${symbol}`;
}

export function CalculationMethodCard({
  result,
  isLoading,
  selectedCrypto,
  currency,
}: CalculationMethodCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cryptoSymbol = cryptoSymbols[selectedCrypto];

  if (isLoading) {
    return (
      <div className="bg-midnight-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
        <div className="h-6 bg-midnight-700 rounded animate-pulse w-1/3" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-midnight-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!result?.method) {
    return (
      <div className="bg-midnight-800/50 border border-slate-700 rounded-lg p-6 text-center text-white">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  const { initialCapital, contribution, frequency, initialPrice, finalPrice, totalCryptoQuantity, contributionCount } = result.method;
  const initialQuantity = initialPrice > 0 ? initialCapital / initialPrice : 0;

  return (
    <div className="bg-midnight-800/50 border border-slate-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-sm text-white/50 hover:underline cursor-pointer"
        >
          {isOpen ? 'Hide calcul' : 'Show calcul'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 text-sm text-white">
          <p>
            <code className="text-cyan-200">
              Q0 = C0 / P0 = {formatCurrency(initialCapital, currency)} / {formatCurrency(initialPrice, currency)} ={' '}
              {formatCrypto(initialQuantity, cryptoSymbol)}
            </code>
          </p>
          <p>
            <code className="text-cyan-200">
              Q_total = Q0 + sum(M / P_i) = {formatCrypto(totalCryptoQuantity, cryptoSymbol)}
            </code>
          </p>
          <p>
            <code className="text-cyan-200">
              C_total = C0 + n * M = {formatCurrency(initialCapital, currency)} + {contributionCount} *{' '}
              {formatCurrency(contribution, currency)} = {formatCurrency(result.totalInvested, currency)}
            </code>
          </p>
          <p>
            <code className="text-cyan-200">
              V_final = Q_total * P_end = {formatCrypto(totalCryptoQuantity, cryptoSymbol)} *{' '}
              {formatCurrency(finalPrice, currency)} = {formatCurrency(result.finalValue, currency)}
            </code>
          </p>
          <p>
            <code className="text-cyan-200">
              ROI = V_final - C_total = {formatCurrency(result.roi, currency)}
            </code>
          </p>
          <p>
            <code className="text-cyan-200">
              ROI% = (ROI / C_total) * 100 = {result.roiPercentage.toFixed(2)}%
            </code>
          </p>
          <p className="text-xs text-white/70">
            n = nombre d’ajouts ({contributionCount}), M = montant par ajout ({formatCurrency(contribution, currency)}),
            P_i = prix au moment de chaque achat. Fréquence {contributionFrequencyLabels[frequency].toLowerCase()}.
          </p>
        </div>
      )}
    </div>
  );
}
