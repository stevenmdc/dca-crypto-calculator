'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import type { CalculationMethodDetails, CalculationResult, CryptoType, Currency } from '@/types';
import { BUY_THE_DIP_LOOKBACK_DAYS } from '@/lib/dcaCalculator';
import { contributionFrequencyLabels, cryptoSymbols, formatCurrency } from '@/lib/utils';

interface CalculationTooltipProps {
  result: CalculationResult;
  method: CalculationMethodDetails;
  selectedCrypto: CryptoType;
  currency: Currency;
}

export function CalculationTooltip({ result, method, selectedCrypto, currency }: CalculationTooltipProps) {
  const [openedBy, setOpenedBy] = useState<'hover' | 'focus' | 'click' | null>(null);
  const tooltipId = useId();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isOpen = openedBy !== null;

  useEffect(() => {
    if (!isOpen) return;

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenedBy(null);
    }

    function dismissOnOutsidePress(event: PointerEvent) {
      if (event.target instanceof Node && !tooltipRef.current?.contains(event.target)) {
        setOpenedBy(null);
      }
    }

    document.addEventListener('keydown', dismissOnEscape);
    document.addEventListener('pointerdown', dismissOnOutsidePress);
    return () => {
      document.removeEventListener('keydown', dismissOnEscape);
      document.removeEventListener('pointerdown', dismissOnOutsidePress);
    };
  }, [isOpen]);

  const { initialCapital, contribution, strategy, initialPrice, finalPrice, totalCryptoQuantity, contributionCount } = method;
  const initialQuantity = initialPrice > 0 ? initialCapital / initialPrice : 0;
  const cryptoSymbol = cryptoSymbols[selectedCrypto];
  const money = (value: number) => formatCurrency(value, currency);
  const quantity = (value: number) => `${value.toFixed(8)} ${cryptoSymbol}`;
  const steps = [
    ...(strategy.type === 'buy-the-dip' ? [{
      label: 'Buy the dip',
      detail: `Un achat par franchissement du seuil de baisse de ${strategy.dipThreshold} % par rapport au plus haut des ${BUY_THE_DIP_LOOKBACK_DAYS} jours précédents.`,
    }] : []),
    { label: 'Achat initial', detail: `${money(initialCapital)} ÷ ${money(initialPrice)} = ${quantity(initialQuantity)}` },
    { label: 'Quantité accumulée', detail: `Quantité initiale + somme des quantités achetées (${money(contribution)} ÷ cours de chaque achat) = ${quantity(totalCryptoQuantity)}` },
    { label: 'Capital total investi', detail: `${money(initialCapital)} + ${contributionCount} × ${money(contribution)} = ${money(result.totalInvested)}`
      + (strategy.type === 'dca' ? ` (rythme ${contributionFrequencyLabels[strategy.frequency].toLowerCase()})` : '') },
    { label: 'Valeur finale', detail: `${quantity(totalCryptoQuantity)} × ${money(finalPrice)} = ${money(result.finalValue)}` },
    { label: 'Gain ou perte', detail: `${money(result.finalValue)} − ${money(result.totalInvested)} = ${money(result.roi)}` },
    { label: 'Rendement', detail: result.totalInvested > 0
      ? `(${money(result.roi)} ÷ ${money(result.totalInvested)}) × 100 = ${result.roiPercentage.toFixed(2)} %`
      : '0 % (aucun capital investi)' },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 flex justify-end">
      <div
        ref={tooltipRef}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setOpenedBy((current) => current ?? 'hover');
        }}
        onPointerLeave={() => setOpenedBy((current) => current === 'hover' ? null : current)}
      >
        <button
          type="button"
          aria-label="Show calcul"
          aria-describedby={tooltipId}
          className="pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-400"
          onFocus={(event) => {
            if (event.currentTarget.matches(':focus-visible')) setOpenedBy('focus');
          }}
          onBlur={() => setOpenedBy((current) => current === 'hover' ? current : null)}
          onClick={() => setOpenedBy((current) => current === 'click' ? null : 'click')}
        >
          <Info aria-hidden="true" className="size-4" />
        </button>
        <div id={tooltipId} role="tooltip" hidden={!isOpen} className="pointer-events-auto absolute right-0 bottom-full z-20 w-full max-w-md pb-2">
          <dl className="space-y-2 rounded-lg border border-slate-600 bg-slate-800 p-4 text-xs text-slate-200 shadow-lg">
            {steps.map(({ label, detail }) => (
              <div key={label}>
                <dt className="font-semibold text-cyan-200">{label}</dt>
                <dd className="wrap-anywhere">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
