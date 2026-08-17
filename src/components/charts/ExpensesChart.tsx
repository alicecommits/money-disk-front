import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AggregatedData, Scale } from "../../types";
import { CHART_COLORS, INTERNAL_CATEGORY, INTERNAL_CHART_COLOR, formatPeriodLabel, formatEuro, pivotForRecharts } from "../../lib/aggregation";
import { CategoryIcon, CategoryLabel } from "../categories/CategoryIcon";

interface Props {
  data: AggregatedData[];
  categoryOrder: string[];
  scale: Scale;
  averageMode: string;
  categoryIcons: Record<string, string | null>;
  currencySymbol?: string;
}

const CustomTooltip = ({
  active, payload, label, categoryIcons, currencySymbol,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  categoryIcons: Record<string, string | null>;
  currencySymbol: string;
}) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-lg border border-border-default bg-bg-tertiary p-3 shadow-lg text-sm">
      <p className="mb-2 font-medium text-text-secondary">{label}</p>
      {[...payload].reverse().map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            <CategoryIcon icon={categoryIcons[p.name]} size="sm" />
            <span className="text-text-secondary">{p.name}</span>
          </span>
          <span className="font-mono text-text-primary">{formatEuro(p.value, currencySymbol)}</span>
        </div>
      ))}
      <div className="mt-2 border-t border-border-subtle pt-2 flex justify-between font-medium">
        <span className="text-text-secondary">Total</span>
        <span className="font-mono text-accent-primary">{formatEuro(total, currencySymbol)}</span>
      </div>
    </div>
  );
};

export function ExpensesChart({ data, categoryOrder, scale, averageMode, categoryIcons, currencySymbol = "€" }: Props) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-text-tertiary">
        No expense data for selected period
      </div>
    );
  }

  const chartData = pivotForRecharts(data, categoryOrder);
  const yLabel = averageMode !== "Off" ? `Average (${currencySymbol})` : `Amount (${currencySymbol})`;

  return (
    <ResponsiveContainer width="100%" height={480}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="period"
          tickFormatter={(v) => formatPeriodLabel(v, scale)}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip categoryIcons={categoryIcons} currencySymbol={currencySymbol} />} />
        <Legend
          wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          formatter={(v) => (
            <CategoryLabel icon={categoryIcons[String(v)]} name={String(v)} className="text-text-secondary" />
          )}
        />
        {categoryOrder.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="exp"
            fill={cat === INTERNAL_CATEGORY ? INTERNAL_CHART_COLOR : CHART_COLORS[i % CHART_COLORS.length]}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
