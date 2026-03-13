import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number; percentage?: number; color?: string; trend?: 'up' | 'down' | 'stable' }[];
}

const DEFAULT_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
  'hsl(180, 60%, 45%)',
  'hsl(320, 70%, 50%)',
  'hsl(200, 80%, 50%)',
];

export function CategoryDonutChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    percentage: item.percentage || Math.round((item.value / total) * 100),
  }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 13% 91%)", fontSize: 13 }}
            formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {chartData.slice(0, 6).map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              {d.trend && (
                <span className={`text-xs ${
                  d.trend === 'up' ? 'text-success' :
                  d.trend === 'down' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {d.trend === 'up' ? '↑' : d.trend === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
            <span className="font-medium">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
