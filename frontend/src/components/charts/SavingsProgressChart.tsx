import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { month: string; savings: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const isPositive = entry.value >= 0;
    const color = isPositive ? "hsl(var(--primary))" : "hsl(var(--destructive))";
    
    return (
      <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
        <p className="font-bold text-sm mb-2 px-1 text-center text-muted-foreground">{label}</p>
        <div className="flex justify-between items-center gap-4 text-sm bg-muted/30 px-3 py-2 rounded-lg border border-border/40">
          <span className="font-medium">Net Savings</span>
          <span className="font-bold font-display text-lg" style={{ color }}>
            {isPositive ? '+' : ''}₹{entry.value.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function SavingsProgressChart({ data }: Props) {
  const yAxisFormatter = (value: number) => {
    if (Math.abs(value) >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (Math.abs(value) >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
          tickMargin={12} 
          axisLine={false} 
          tickLine={false} 
        />
        <YAxis 
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
          tickFormatter={yAxisFormatter} 
          axisLine={false} 
          tickLine={false}
          width={50}
        />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
        <Bar dataKey="savings" radius={[6, 6, 6, 6]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.savings >= 0 ? "hsl(var(--primary))" : "hsl(var(--destructive))"} opacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
