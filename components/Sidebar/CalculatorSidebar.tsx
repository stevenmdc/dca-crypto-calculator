'use client';

import { useId } from 'react';
import { ChevronDown, DollarSign, Euro } from 'lucide-react';
import type { ContributionFrequency, CryptoType, Currency, PriceCoverage } from '@/types';
import { contributionFrequencyLabels, currencySymbols } from '@/lib/utils';
import { CryptoSelector } from '@/components/Sidebar/CryptoSelector';
import { InputField } from '@/components/Sidebar/InputField';
import { DatePicker } from '@/components/Sidebar/DatePicker';
import { CalculateButton } from '@/components/Sidebar/CalculateButton';

interface CalculatorSidebarProps {
  selectedCrypto: CryptoType;
  onSelectCrypto: (crypto: CryptoType) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  initialCapital: number;
  onInitialCapitalChange: (value: number) => void;
  contribution: number;
  onContributionChange: (value: number) => void;
  frequency: ContributionFrequency;
  onFrequencyChange: (frequency: ContributionFrequency) => void;
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
  frequency,
  onFrequencyChange,
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
  const frequencyId = useId();
  const currencyIcon = currency === 'EUR' ? Euro : DollarSign;
  const currencySymbol = currencySymbols[currency];
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
                <span className="block rounded-lg border border-slate-700 bg-midnight-800 px-3 py-2 text-center text-sm text-white hover:bg-midnight-700 peer-checked:border-cyan-400 peer-checked:text-cyan-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-400">
                  {option} ({currencySymbols[option]})
                </span>
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
              label={`Montant ajouté (${currencySymbol})`}
              value={contribution}
              onChange={onContributionChange}
              icon={currencyIcon}
              min={0}
              step={10}
            />
            <div className="space-y-2">
              <label htmlFor={frequencyId} className="block text-sm font-medium text-white">
                Fréquence
              </label>
              <div className="relative">
                <select
                  id={frequencyId}
                  value={frequency}
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
          </div>
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
          isDisabled={!coverage || initialCapital < 0 || contribution < 0
            || !startDate || !endDate || startDate >= endDate
            || startDate < coverage.firstDate || endDate > coverage.lastDate}
        />
        {syncDate && <p className="text-sm text-slate-400">Dernière synchronisation le {syncDate} UTC</p>}
      </div>
    </aside>
  );
}
