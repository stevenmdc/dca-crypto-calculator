import { DCAResult, CalculationResult, ChartDataPoint, PriceData } from '@/types';

export function calculateDCA(
  initialCapital: number,
  monthlyAddition: number,
  startDate: Date,
  endDate: Date,
  historicalPrices: PriceData[]
): DCAResult {
  const dates: Date[] = [];
  const portfolioValues: number[] = [];
  const investedCapital: number[] = [];
  const cryptoQuantity: number[] = [];
  const prices: number[] = [];

   let totalCryptoQuantity = 0;
   let totalInvestedAmount = 0;

   // Initial investment
   if (historicalPrices.length > 0) {
     const initialPrice = historicalPrices[0].price;
     totalCryptoQuantity = initialCapital / initialPrice;
     totalInvestedAmount = initialCapital;

     dates.push(new Date(startDate));
     investedCapital.push(totalInvestedAmount);
     cryptoQuantity.push(totalCryptoQuantity);
     portfolioValues.push(totalCryptoQuantity * initialPrice);
     prices.push(initialPrice);
   }

   // Monthly additions
   let currentDate = new Date(startDate);
   while (currentDate < endDate) {
     // Move to next month
     currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

     if (currentDate > endDate) break;

    // Find price at or near this date
    const price = findClosestPrice(currentDate, historicalPrices);
    if (!price) continue;

    // Add monthly amount
    const quantityBought = monthlyAddition / price;
    totalCryptoQuantity += quantityBought;
    totalInvestedAmount += monthlyAddition;

    // Store data
    dates.push(new Date(currentDate));
    investedCapital.push(totalInvestedAmount);
    cryptoQuantity.push(totalCryptoQuantity);
    portfolioValues.push(totalCryptoQuantity * price);
    prices.push(price);
  }

  return {
    dates,
    portfolioValues,
    investedCapital,
    cryptoQuantity,
    prices,
  };
}

function findClosestPrice(date: Date, prices: PriceData[]): number | null {
  if (prices.length === 0) return null;

  const timestamp = date.getTime();
  let closest = prices[0];
  let minDiff = Math.abs(timestamp - closest.timestamp);

  for (const price of prices) {
    const diff = Math.abs(timestamp - price.timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = price;
    }
  }

  return closest.price;
}

export function prepareChartData(
  dates: Date[],
  portfolioValues: number[],
  investedCapital: number[]
): ChartDataPoint[] {
  return dates.map((date, index) => ({
    date: date.toLocaleDateString('fr-FR', { year: '2-digit', month: '2-digit' }),
    portfolioValue: Math.round(portfolioValues[index] * 100) / 100,
    investedCapital: Math.round(investedCapital[index] * 100) / 100,
  }));
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
