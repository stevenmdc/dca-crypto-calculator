'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  DefaultTooltipContent,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint, ChartInterval, CryptoType, Currency } from '@/types';
import { sampleChartData } from '@/lib/dcaCalculator';
import { DAY_MS } from '@/lib/price-dates';
import { cryptoSymbols, currencySymbols, formatCurrency } from '@/lib/utils';

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: '2-digit', year: '2-digit', timeZone: 'UTC' });
const dayMonthFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeZone: 'UTC' });
const chartIntervals = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

function chartTimestamp(point: ChartDataPoint): number {
  return Date.parse(point.date);
}

interface DCAChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  cryptoType: CryptoType;
  currency: Currency;
}

export function DCAChart({ data, isLoading, cryptoType, currency }: DCAChartProps) {
  const [interval, setInterval] = useState<ChartInterval>('monthly');
  const visibleData = useMemo(() => sampleChartData(data, interval), [data, interval]);

  return (
    <div className="rounded-lg border border-slate-700 bg-midnight-900 p-4 sm:p-6">
      <div role="group" aria-label="Fréquence d’affichage du graphique" className="mb-3 inline-flex flex-wrap gap-1 rounded-lg border border-slate-700 p-1">
        {chartIntervals.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
            className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400 aria-pressed:bg-slate-800 aria-pressed:text-cyan-200"
          >
            {label}
          </button>
        ))}
      </div>
      <h2 className="mb-4 text-xl font-bold text-white">Évolution du portefeuille</h2>
      {isLoading || visibleData.length === 0 ? (
        <div className="grid h-[300px] place-items-center text-center text-white" role="status">
          {isLoading ? 'Chargement du graphique...' : 'Lancez une simulation pour voir le graphique'}
        </div>
      ) : (
        <PortfolioChart data={visibleData} cryptoType={cryptoType} currency={currency} interval={interval} />
      )}
    </div>
  );
}

function PortfolioChart({ data, cryptoType, currency, interval }: Omit<DCAChartProps, 'isLoading'> & { interval: ChartInterval }) {

  const lineColorByCrypto: Record<CryptoType, string> = {
    bitcoin: '#f97316',
    ethereum: '#a855f7',
    solana: '#14f195',
    xrp: '#22d3ee',
  };
  const lineColor = lineColorByCrypto[cryptoType];
  const cryptoSymbol = cryptoSymbols[cryptoType];
  const span = chartTimestamp(data[data.length - 1]) - chartTimestamp(data[0]);
  const tickFormat = interval === 'monthly' || span > 120 * DAY_MS ? monthFormat : dayMonthFormat;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={lineColor} stopOpacity={0.8} />
            <stop offset="95%" stopColor={lineColor} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey={chartTimestamp}
          type="number"
          scale="utc"
          domain={['dataMin', 'dataMax']}
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => tickFormat.format(Number(value))}
        />
        <YAxis
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
          unit={` ${currencySymbols[currency]}`}
          width="auto"
        />
        <Tooltip
          labelFormatter={(date) => typeof date === 'number' ? dateFormat.format(date) : date}
          formatter={(value) => typeof value === 'number' ? formatCurrency(value, currency) : value}
          content={({ active, payload, ...props }) => {
            const point: ChartDataPoint | undefined = payload[0]?.payload;
            if (!active || !point) return null;

            return (
              <DefaultTooltipContent
                {...props}
                payload={[...payload, {
                  name: 'Quantité accumulée',
                  value: `${point.cryptoQuantity.toFixed(2)} ${cryptoSymbol}`,
                  color: '#e2e8f0',
                }]}
              />
            );
          }}
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            borderRadius: '8px',
            color: '#e2e8f0',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="portfolioValue"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          fill="url(#colorPortfolio)"
          name="Valeur du portefeuille"
        />
        <Line
          type="monotone"
          dataKey="investedCapital"
          stroke="#64748b"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          name="Capital investi"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
