import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart } from "recharts";

interface Props {
  data: { month: string; savings: number }[];
}

export function SavingsProgressChart({ data }: Props) {
  const cumulative = data.map((d, i) => ({
    ...d,
    cumulative: data.slice(0, i + 1).reduce((s, x) => s + x.savings, 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={cumulative}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" tickFormatter={(v) => `₹${v / 1000}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 13% 91%)", fontSize: 13 }}
          formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
        />
        <Bar dataKey="savings" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} name="Monthly Savings" />
        <Line type="monotone" dataKey="cumulative" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Cumulative" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
