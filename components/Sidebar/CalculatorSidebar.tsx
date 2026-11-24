'use client';

import { useId } from 'react';
import { ChevronDown, DollarSign, Euro, Percent } from 'lucide-react';
import type { ContributionFrequency, CryptoType, Currency, InvestmentStrategy, PriceCoverage } from '@/types';
import { BUY_THE_DIP_LOOKBACK_DAYS } from '@/lib/dcaCalculator';
import { contributionFrequencyLabels, currencySymbols, isValidDipThreshold } from '@/lib/utils';
import { CryptoSelector } from '@/components/Sidebar/CryptoSelector';
import { InputField } from '@/components/Sidebar/InputField';
import { DatePicker } from '@/components/Sidebar/DatePicker';
import { CalculateButton } from '@/components/Sidebar/CalculateButton';

const strategyOptions = [
  { value: 'dca', label: 'DCA' },
  { value: 'buy-the-dip', label: 'Buy the dip' },
] as const;

const radioOptionClass = 'block rounded-lg border border-slate-700 bg-midnight-800 px-3 py-2 text-center text-sm text-white hover:bg-midnight-700 peer-checked:border-cyan-400 peer-checked:text-cyan-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400';

interface CalculatorSidebarProps {
  selectedCrypto: CryptoType;
  onSelectCrypto: (crypto: CryptoType) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  initialCapital: number;
  onInitialCapitalChange: (value: number) => void;
  contribution: number;
  onContributionChange: (value: number) => void;
  strategy: InvestmentStrategy;
  onStrategyChange: (type: InvestmentStrategy['type']) => void;
  onFrequencyChange: (frequency: ContributionFrequency) => void;
  onDipThresholdChange: (value: number) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  coverage?: PriceCoverage;
  error: string | null;
  isLoading: boolean;
  onCalculate: () => void;
}

export function CalculatorSidebar({
  selectedCrypto,
  onSelectCrypto,
  currency,
  onCurrencyChange,
  initialCapital,
  onInitialCapitalChange,
  contribution,
  onContributionChange,
  strategy,
  onStrategyChange,
  onFrequencyChange,
  onDipThresholdChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  coverage,
  error,
  isLoading,
  onCalculate,
}: CalculatorSidebarProps) {
  const currencyGroup = useId();
  const strategyGroup = useId();
  const frequencyId = useId();
  const currencyIcon = currency === 'EUR' ? Euro : DollarSign;
  const currencySymbol = currencySymbols[currency];
  const isDipThresholdInvalid = strategy.type === 'buy-the-dip' && !isValidDipThreshold(strategy.dipThreshold);
  const syncDate = coverage?.syncedAt && new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC',
  }).format(new Date(coverage.syncedAt));

  return (
    <aside className="lg:w-80 lg:sticky lg:top-8 h-fit">
      <div className="bg-midnight border border-slate-800 rounded-lg p-6 space-y-4">
        <div>
          <CryptoSelector selectedCrypto={selectedCrypto} onSelectCrypto={onSelectCrypto} />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-white">Devise</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['EUR', 'USD'] as const).map((option) => (
              <label key={option} className="cursor-pointer">
                <input
                  type="radio"
                  name={currencyGroup}
                  value={option}
                  checked={currency === option}
                  onChange={() => onCurrencyChange(option)}
                  className="peer sr-only"
                />
                <span className={radioOptionClass}>
                  {option} ({currencySymbols[option]})
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-white">Stratégie</legend>
          <div className="grid grid-cols-2 gap-3">
            {strategyOptions.map(({ value, label }) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name={strategyGroup}
                  value={value}
                  checked={strategy.type === value}
                  onChange={() => onStrategyChange(value)}
                  className="peer sr-only"
                />
                <span className={radioOptionClass}>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-4">
          <InputField
            label={`Capital initial (${currencySymbol})`}
            value={initialCapital}
            onChange={onInitialCapitalChange}
            icon={currencyIcon}
            min={0}
            step={100}
          />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7.75rem),1fr))] items-end gap-2">
            <InputField
              label={`${strategy.type === 'dca' ? 'Montant ajouté' : 'Montant par achat'} (${currencySymbol})`}
              value={contribution}
              onChange={onContributionChange}
              icon={currencyIcon}
              min={0}
              step={10}
            />
            {strategy.type === 'dca' ? (
              <div className="space-y-2">
                <label htmlFor={frequencyId} className="block text-sm font-medium text-white">
                  Fréquence
                </label>
                <div className="relative">
                  <select
                    id={frequencyId}
                    value={strategy.frequency}
                    onChange={(event) => onFrequencyChange(event.target.value as ContributionFrequency)}
                    className="block h-10.5 w-full min-w-0 appearance-none rounded-lg border border-slate-700 bg-midnight pl-2 pr-6 text-sm text-white scheme-dark focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  >
                    {Object.entries(contributionFrequencyLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-slate-300" />
                </div>
              </div>
            ) : (
              <InputField
                label="Seuil de baisse (%)"
                value={strategy.dipThreshold}
                onChange={onDipThresholdChange}
                icon={Percent}
                max={100}
                step="any"
              />
            )}
          </div>
          {strategy.type === 'buy-the-dip' && (
            <p className={`text-xs ${isDipThresholdInvalid ? 'text-red-400' : 'text-slate-400'}`}>
              {isDipThresholdInvalid
                ? 'Saisis un seuil supérieur à 0 % et inférieur à 100 %.'
                : `Un achat quand la baisse atteint le seuil, par rapport au plus haut des ${BUY_THE_DIP_LOOKBACK_DAYS} jours précédents de la simulation.`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7.25rem),1fr))] gap-2">
          <DatePicker
            label="Date de début"
            value={startDate}
            onChange={onStartDateChange}
            min={coverage?.firstDate}
            max={endDate || coverage?.lastDate}
          />
          <DatePicker
            label="Date de fin"
            value={endDate}
            onChange={onEndDateChange}
            min={startDate || coverage?.firstDate}
            max={coverage?.lastDate}
          />
        </div>

        {!coverage && <p className="text-sm text-slate-400">Historique indisponible pour cette crypto.</p>}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <CalculateButton
          onClick={onCalculate}
          isLoading={isLoading}
          isDisabled={!coverage || initialCapital < 0 || contribution < 0 || isDipThresholdInvalid
            || !startDate || !endDate || startDate >= endDate
            || startDate < coverage.firstDate || endDate > coverage.lastDate}
        />
        {syncDate && <p className="text-sm text-slate-400">Dernière synchronisation le {syncDate} UTC</p>}
      </div>
    </aside>
  );
}
