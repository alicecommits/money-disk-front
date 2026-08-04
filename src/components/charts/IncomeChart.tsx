import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { AggregatedData, Scale } from "../../types";
import { formatPeriodLabel, formatEuro, pivotForRecharts } from "../../lib/aggregation";

interface Props {
  data: AggregatedData[];
  categoryOrder: string[];
  scale: Scale;
  averageMode: string;
}

// Income uses green-tinted colors
const INCOME_COLORS = ["#22c55e", "#06b6d4", "#a78bfa", "#f59e0b"];

export function IncomeChart({ data, categoryOrder, scale, averageMode }: Props) {
  if (!data.length || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-text-tertiary">
        No income data for selected period
      </div>
    );
  }

  const chartData = pivotForRecharts(data, categoryOrder);
  const yLabel = averageMode !== "Off" ? "Average (€)" : "Amount (€)";

  return (
    <ResponsiveContainer width="100%" height={360}>
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
          tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          label={{ value: yLabel, angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
        />
        <Tooltip
          formatter={(v, name) => [formatEuro(Number(v)), String(name)]}
          contentStyle={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-default)",
            borderRadius: 8,
          }}
          labelFormatter={(v) => formatPeriodLabel(String(v), scale)}
        />
        <Legend
          wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          formatter={(v) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>}
        />
        {categoryOrder.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="inc"
            fill={INCOME_COLORS[i % INCOME_COLORS.length]}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
