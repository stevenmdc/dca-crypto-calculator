export type CryptoType = 'bitcoin' | 'ethereum';

export interface FormInputs {
  crypto: CryptoType;
  initialCapital: number;
  monthlyAddition: number;
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
}

export interface CalculationResult {
  totalInvested: number;
  finalValue: number;
  roi: number;
  roiPercentage: number;
  chartData: ChartDataPoint[];
}

export interface DCAResult {
  dates: Date[];
  portfolioValues: number[];
  investedCapital: number[];
  cryptoQuantity: number[];
  prices: number[];
}
