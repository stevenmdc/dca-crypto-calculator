export type CryptoType = 'bitcoin' | 'ethereum' | 'solana' | 'xrp';
export type Currency = 'EUR' | 'USD';
export type ContributionFrequency = 'weekly' | 'monthly' | 'yearly';
export type ChartInterval = 'daily' | 'weekly' | 'monthly';

export interface PriceCoverage {
  firstDate: string;
  lastDate: string;
  syncedAt: string | null;
}

export interface FormInputs {
  crypto: CryptoType;
  initialCapital: number;
  contribution: number;
  startDate: Date;
  endDate: Date;
}

export interface PriceData {
  timestamp: number;
  price: number;
}

export interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  investedCapital: number;
  cryptoQuantity: number;
}

export interface CalculationMethodDetails {
  initialCapital: number;
  contribution: number;
  frequency: ContributionFrequency;
  initialPrice: number;
  finalPrice: number;
  totalCryptoQuantity: number;
  contributionCount: number;
}

export interface CalculationResult {
  totalInvested: number;
  finalValue: number;
  roi: number;
  roiPercentage: number;
  chartData: ChartDataPoint[];
  method?: CalculationMethodDetails;
}

export interface DCAResult {
  dates: Date[];
  portfolioValues: number[];
  investedCapital: number[];
  cryptoQuantity: number[];
  prices: number[];
  contributionCount: number;
}
