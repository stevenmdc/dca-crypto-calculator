import { FormInputs } from '@/types';

export function formatCurrency(value: number, currency: string = '€'): string {
  return `${currency}${value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function validateFormInputs(inputs: FormInputs): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (inputs.initialCapital < 0) {
    errors.push('Le capital initial doit être positif');
  }

  if (inputs.monthlyAddition < 0) {
    errors.push('L\'ajout mensuel doit être positif');
  }

  if (inputs.startDate >= inputs.endDate) {
    errors.push('La date de début doit être avant la date de fin');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

export function dateToISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function dateFromISOString(isoString: string): Date {
  return new Date(isoString + 'T00:00:00Z');
}

export function getDefaultStartDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 1);
  return date;
}

export function getDefaultEndDate(): Date {
  return new Date();
}
