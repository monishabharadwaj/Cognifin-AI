import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryDataEntry {
  name: string;
  value?: number;
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
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0].payload;
  return (
    <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
      <p className="font-bold text-sm mb-3 px-1">{entry.name}</p>
      <div className="flex justify-between items-center gap-6 text-sm bg-muted/30 px-3 py-2 rounded-lg border border-border/40">
        <span className="flex flex-col">
          <span className="font-bold font-display text-lg leading-tight" style={{ color: entry.color }}>{formatINR(entry.value)}</span>
          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">{entry.percentage}% of total</span>
        </span>
      </div>
    </div>
  );
}

export function CategoryDonutChart({ data }: Props) {
  // ── Empty state ────────────────────────────────────────────────────────────
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground opacity-50" />
        </div>
        <p className="text-sm font-medium text-foreground">
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
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground opacity-50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          All categories have zero spending.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-4 h-[260px]">
      {/* Donut chart */}
      <ResponsiveContainer width="50%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            dataKey="value"
            paddingAngle={3}
            strokeWidth={0}
          >
            {chartData.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex-1 space-y-3 min-w-0 py-2">
        {chartData.slice(0, 6).map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between text-sm gap-2 w-full group"
          >
            {/* Colour dot + name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="h-3 w-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors truncate" title={d.name}>
                {d.name}
              </span>
              {d.trend && (
                <span
                  className={`text-[10px] flex-shrink-0 px-1 py-0.5 rounded bg-muted/50 ${
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
            <span className="font-bold tabular-nums flex-shrink-0 text-right w-10">
              {d.percentage}%
            </span>
          </div>
        ))}

        {/* "and N more" if > 6 categories */}
        {chartData.length > 6 && (
          <div className="pt-2 mt-2 border-t border-border/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
            + {chartData.length - 6} more
          </div>
        )}
      </div>
    </div>
  );
}
