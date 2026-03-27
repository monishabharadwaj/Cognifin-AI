import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";

interface CategoryDataEntry {
  name: string;
  amount?: number;
  value?: number;
  percentage?: number;
  color?: string;
  trend?: "up" | "down" | "stable";
}

interface Props {
  data: CategoryDataEntry[];
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function CategoryBarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-20 w-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mb-6 border border-white/10">
          <BarChart3 className="h-10 w-10 text-slate-700" />
        </div>
        <p className="text-sm font-black text-white uppercase tracking-widest">Intelligence Gap</p>
        <p className="text-xs text-slate-500 mt-2 font-medium">Categorized spending will appear here.</p>
      </div>
    );
  }

  const chartData = data
    .map((d, index) => ({
      name: d.name,
      value: d.value ?? d.amount ?? 0,
      color: d.color ?? (index === 0 ? "#10B981" : index === 1 ? "#059669" : index === 2 ? "#047857" : "#064E3B")
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }} layout="vertical">
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fill: "#94A3B8", fontWeight: 700, className: "uppercase tracking-tighter" }} 
          width={100}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)", rx: 12 }}
          contentStyle={{ 
            borderRadius: '24px', 
            border: "1px solid rgba(255,255,255,0.05)", 
            fontSize: 12,
            backgroundColor: "rgba(11, 18, 24, 0.95)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            padding: '16px'
          }}
          itemStyle={{ color: "#fff", fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}
          labelStyle={{ color: "#94A3B8", marginBottom: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}
          formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "DETECTION VALUE"]}
        />
        <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={24}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

