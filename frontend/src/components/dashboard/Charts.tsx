'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatTaka } from '@/utils/helpers/format';

const shortDay = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const compactTaka = (n: number) =>
  n >= 100000 ? `৳${(n / 100000).toFixed(1)}L` : n >= 1000 ? `৳${Math.round(n / 1000)}k` : `৳${n}`;

/** Daily revenue (area) for dashboards. */
export function RevenueChart({
  data,
  valueKey,
  label = 'Revenue',
}: {
  data: { day: string }[];
  valueKey: string;
  label?: string;
}) {
  const config = { [valueKey]: { label, color: 'var(--chart-1)' } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id={`fill-${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={`var(--color-${valueKey})`} stopOpacity={0.35} />
            <stop offset="95%" stopColor={`var(--color-${valueKey})`} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={shortDay}
        />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compactTaka} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={v => shortDay(String(v))}
              formatter={v => formatTaka(Number(v))}
            />
          }
        />
        <Area
          dataKey={valueKey}
          type="monotone"
          stroke={`var(--color-${valueKey})`}
          strokeWidth={2}
          fill={`url(#fill-${valueKey})`}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function BarList({
  data,
  labelKey,
  valueKey,
}: {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
}) {
  const config = { [valueKey]: { label: 'Value', color: 'var(--chart-1)' } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey={labelKey} tickLine={false} axisLine={false} width={110} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={v => formatTaka(Number(v))} hideLabel />}
        />
        <Bar dataKey={valueKey} fill={`var(--color-${valueKey})`} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
