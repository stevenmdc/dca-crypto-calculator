import type { ContributionFrequency, CryptoType, Currency, FormInputs } from '@/types';

export const currencySymbols = { EUR: '€', USD: '$' } satisfies Record<Currency, string>;
export const cryptoSymbols = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  xrp: 'XRP',
} satisfies Record<CryptoType, string>;

export const contributionFrequencyLabels = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  yearly: 'Annuel',
} satisfies Record<ContributionFrequency, string>;

export function formatCurrency(value: number, currency: Currency = 'EUR'): string {
  return value.toLocaleString('fr-FR', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  });
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function isValidDipThreshold(value: number): boolean {
  return value > 0 && value < 100;
}

export function validateFormInputs(inputs: FormInputs): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (inputs.initialCapital < 0) {
    errors.push('Le capital initial doit être positif');
  }

  if (inputs.contribution < 0) {
    errors.push('Le montant de l’ajout doit être positif');
  }

  if (!Number.isFinite(inputs.startDate.getTime()) || !Number.isFinite(inputs.endDate.getTime())) {
    errors.push('Saisis des dates valides');
  } else if (inputs.startDate >= inputs.endDate) {
    errors.push('La date de début doit être avant la date de fin');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (inputs.endDate > today) {
    errors.push('La date de fin ne peut pas être dans le futur');
  }

  if (inputs.startDate > today) {
    errors.push('La date de début ne peut pas être dans le futur');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function dateFromISOString(isoString: string): Date {
  return new Date(isoString + 'T00:00:00Z');
}
