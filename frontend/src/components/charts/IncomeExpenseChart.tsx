import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { month: string; income: number; expenses: number; savings?: number }[];
}

export function IncomeExpenseChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" />
        <YAxis tick={{ fontSize: 12 }} stroke="hsl(220 9% 46%)" tickFormatter={(v) => `₹${v / 1000}k`} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(220 13% 91%)", fontSize: 13 }}
          formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
        />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="hsl(142 71% 45%)" strokeWidth={2.5} dot={{ r: 4 }} name="Income" />
        <Line type="monotone" dataKey="expenses" stroke="hsl(0 84% 60%)" strokeWidth={2.5} dot={{ r: 4 }} name="Expenses" />
        {data.some(d => d.savings !== undefined) && (
          <Line type="monotone" dataKey="savings" stroke="hsl(217 91% 60%)" strokeWidth={2.5} dot={{ r: 4 }} name="Savings" />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
