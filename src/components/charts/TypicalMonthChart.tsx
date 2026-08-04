import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { CategoryTotal } from "../../types";
import { CHART_COLORS, formatEuro } from "../../lib/aggregation";
import { CategoryLabel, categoryOptionLabel } from "../categories/CategoryIcon";

interface Props {
  data: CategoryTotal[]; // sorted ascending (smallest first → largest at bottom)
  monthCount: number;
  categoryIcons: Record<string, string | null>;
}

export function TypicalMonthChart({ data, monthCount, categoryIcons }: Props) {
  if (!data.length) return null;

  const total = data.reduce((s, d) => s + d.amount, 0);

  // Convert to Recharts single-row horizontal format
  const chartRow: Record<string, number | string> = { label: "Typical Month" };
  for (const d of [...data].reverse()) chartRow[d.category] = d.amount; // reverse = descending

  const categories = [...data].reverse().map((d) => d.category);

  return (
    <div>
      <p className="mb-3 text-sm text-text-secondary">
        Monthly average over {monthCount} month{monthCount !== 1 ? "s" : ""} —{" "}
        <span className="font-medium text-accent-primary">{formatEuro(total)} / mo</span>
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart
          layout="vertical"
          data={[chartRow]}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => `€${Math.round(v / 100) * 100}`}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="label" hide />
          <Tooltip
            formatter={(v, name) => [formatEuro(Number(v)), categoryOptionLabel(categoryIcons[String(name)], String(name))]}
            contentStyle={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-default)",
              borderRadius: 8,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(v) => (
              <CategoryLabel icon={categoryIcons[String(v)]} name={String(v)} className="text-text-secondary" />
            )}
          />
          {categories.map((cat, i) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="typ"
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
