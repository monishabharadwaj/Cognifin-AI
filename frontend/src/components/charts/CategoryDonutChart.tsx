import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryDataEntry {
  name: string;
  /** Primary value field — chart uses this for sizing */
  value?: number;
  /** Alternative to value — used by CategoryEntry from the dashboard */
  amount?: number;
  percentage?: number;
  color?: string;
  trend?: "up" | "down" | "stable";
}

interface Props {
  data: CategoryDataEntry[];
}

const DEFAULT_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
  "hsl(180, 60%, 45%)",
  "hsl(320, 70%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(30, 90%, 55%)",
  "hsl(270, 75%, 60%)",
];

function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Custom tooltip content
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0].payload;
  return (
    <div
      style={{
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{entry.name}</p>
      <p style={{ color: entry.color }}>{formatINR(entry.value)}</p>
      <p style={{ color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
        {entry.percentage}% of total
      </p>
    </div>
  );
}

export function CategoryDonutChart({ data }: Props) {
  // ── Empty state ────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
        <p className="text-sm font-medium text-muted-foreground">
          No spending data available
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Add some expense transactions to see your spending breakdown by
          category.
        </p>
      </div>
    );
  }

  // ── Normalise data ─────────────────────────────────────────────────────────
  // Support both `value` (chart convention) and `amount` (CategoryEntry convention)
  const resolveValue = (d: CategoryDataEntry): number =>
    d.value ?? d.amount ?? 0;

  const total = data.reduce((sum, d) => sum + resolveValue(d), 0);

  const chartData = data
    .filter((d) => resolveValue(d) > 0)
    .map((item, index) => {
      const resolved = resolveValue(item);
      return {
        ...item,
        name: capitalize(item.name),
        value: resolved,
        color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
        percentage:
          item.percentage != null
            ? item.percentage
            : total > 0
              ? Math.round((resolved / total) * 100)
              : 0,
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
        <p className="text-sm text-muted-foreground">
          All categories have zero spending.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-4">
      {/* Donut chart */}
      <ResponsiveContainer width="50%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={88}
            dataKey="value"
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {chartData.slice(0, 7).map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between text-sm gap-2"
          >
            {/* Colour dot + name */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-muted-foreground truncate" title={d.name}>
                {d.name}
              </span>
              {d.trend && (
                <span
                  className={`text-xs flex-shrink-0 ${
                    d.trend === "up"
                      ? "text-destructive"
                      : d.trend === "down"
                        ? "text-success"
                        : "text-muted-foreground"
                  }`}
                >
                  {d.trend === "up" ? "↑" : d.trend === "down" ? "↓" : "→"}
                </span>
              )}
            </div>

            {/* Percentage */}
            <span className="font-medium tabular-nums flex-shrink-0">
              {d.percentage}%
            </span>
          </div>
        ))}

        {/* "and N more" if > 7 categories */}
        {chartData.length > 7 && (
          <p className="text-xs text-muted-foreground pt-1">
            + {chartData.length - 7} more categories
          </p>
        )}
      </div>
    </div>
  );
}
