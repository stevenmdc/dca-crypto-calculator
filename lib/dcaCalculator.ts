import type { CalculationResult, ChartDataPoint, ChartInterval, ContributionFrequency, DCAResult, PriceData } from '@/types';
import { DAY_MS, utcDay } from './price-dates';

interface SimulationOptions {
  frequency?: ContributionFrequency;
  dailyValuations?: boolean;
}

export function calculateDCA(
  initialCapital: number,
  contribution: number,
  startDate: Date,
  endDate: Date,
  historicalPrices: PriceData[],
  { frequency = 'monthly', dailyValuations = false }: SimulationOptions = {},
): DCAResult {
  const dates: Date[] = [];
  const portfolioValues: number[] = [];
  const investedCapital: number[] = [];
  const cryptoQuantity: number[] = [];
  const prices: number[] = [];

  const start = startDate.getTime();
  const end = endDate.getTime();
  let totalCryptoQuantity = 0;
  let totalInvestedAmount = 0;
  let contributionCount = 0;
  let priceIndex = 0;
  let purchaseNumber = 1;
  let nextPurchase = contributionDate(startDate, frequency, purchaseNumber);

  for (let timestamp = start; historicalPrices.length > 0 && timestamp <= end;) {
    // Advance through the sorted history, using the first price if the date precedes it.
    while (priceIndex + 1 < historicalPrices.length && historicalPrices[priceIndex + 1].timestamp <= timestamp) {
      priceIndex++;
    }
    const price = historicalPrices[priceIndex].price;

    if (timestamp === start) {
      totalInvestedAmount = initialCapital;
      totalCryptoQuantity = initialCapital / price;
    } else if (timestamp === nextPurchase) {
      totalInvestedAmount += contribution;
      totalCryptoQuantity += contribution / price;
      if (contribution > 0) contributionCount++;
      purchaseNumber++;
      nextPurchase = contributionDate(startDate, frequency, purchaseNumber);
    }

    dates.push(new Date(timestamp));
    investedCapital.push(totalInvestedAmount);
    cryptoQuantity.push(totalCryptoQuantity);
    portfolioValues.push(totalCryptoQuantity * price);
    prices.push(price);
    if (timestamp === end) break;
    const nextValuation = dailyValuations ? timestamp + DAY_MS : Infinity;
    timestamp = Math.min(nextValuation, nextPurchase, end);
  }

  return {
    dates,
    portfolioValues,
    investedCapital,
    cryptoQuantity,
    prices,
    contributionCount,
  };
}

function contributionDate(start: Date, frequency: ContributionFrequency, purchaseNumber: number): number {
  if (frequency === 'weekly') return start.getTime() + purchaseNumber * 7 * DAY_MS;
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  if (frequency === 'monthly') return Date.UTC(year, month + purchaseNumber, 1);

  const purchaseYear = year + purchaseNumber;
  const daysInMonth = new Date(Date.UTC(purchaseYear, month + 1, 0)).getUTCDate();
  return Date.UTC(purchaseYear, month, Math.min(start.getUTCDate(), daysInMonth));
}

export function prepareChartData(
  dates: Date[],
  portfolioValues: number[],
  investedCapital: number[],
  cryptoQuantity: number[],
): ChartDataPoint[] {
  return dates.map((date, index) => ({
    date: utcDay(date.getTime()),
    portfolioValue: Math.round(portfolioValues[index] * 100) / 100,
    investedCapital: Math.round(investedCapital[index] * 100) / 100,
    cryptoQuantity: cryptoQuantity[index],
  }));
}

export function sampleChartData(data: ChartDataPoint[], interval: ChartInterval): ChartDataPoint[] {
  if (interval === 'daily') return data;

  // Keep the first valuation and the last available valuation in each calendar period.
  return data.filter((point, index) => {
    const next = data[index + 1];
    if (index === 0 || !next) return true;
    if (interval === 'monthly') return point.date.slice(0, 7) !== next.date.slice(0, 7);
    return startOfWeek(point.date) !== startOfWeek(next.date);
  });
}

function startOfWeek(date: string): number {
  const timestamp = Date.parse(date);
  const daysSinceMonday = (new Date(timestamp).getUTCDay() + 6) % 7;
  return timestamp - daysSinceMonday * DAY_MS;
}

export function calculateMetrics(
  totalInvested: number,
  finalValue: number
): CalculationResult {
  const roi = finalValue - totalInvested;
  const roiPercentage = totalInvested > 0 ? (roi / totalInvested) * 100 : 0;

  return {
    totalInvested,
    finalValue,
    roi,
    roiPercentage,
    chartData: [],
  };
}
