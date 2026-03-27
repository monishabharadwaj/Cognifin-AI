import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { month: string; income: number; expenses: number; savings?: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="backdrop-blur-xl border border-white/10 rounded-[24px] p-6 shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: "rgba(11, 18, 24, 0.95)",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#10B981] to-[#8B5CF6]" />
        <p className="font-black text-xs text-slate-500 uppercase tracking-[0.2em] mb-4">{label}</p>
        <div className="space-y-4">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-10">
              <span className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: entry.color }} />
                <span className="text-white font-bold text-sm tracking-tight">{entry.name}</span>
              </span>
              <span className="font-black text-base tabular-nums" style={{ color: entry.color }}>
                ₹{entry.value.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function IncomeExpenseChart({ data }: Props) {
  const yAxisFormatter = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
    return `₹${value}`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="8 8" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700, className: "uppercase tracking-widest" }}
          tickMargin={15}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700 }}
          tickFormatter={yAxisFormatter}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Legend
          wrapperStyle={{ fontSize: '10px', paddingTop: '32px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#64748B' }}
          iconType="circle"
          iconSize={8}
        />
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#10B981" 
          strokeWidth={4} 
          dot={{ r: 0 }} 
          activeDot={{ r: 6, strokeWidth: 4, stroke: "#10B981", fill: "#0B1218" }} 
          name="Income Stream" 
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="#EF4444" 
          strokeWidth={4} 
          dot={{ r: 0 }} 
          activeDot={{ r: 6, strokeWidth: 4, stroke: "#EF4444", fill: "#0B1218" }} 
          name="Expenditure" 
        />
        {data.some(d => d.savings !== undefined) && (
          <Line 
            type="monotone" 
            dataKey="savings" 
            stroke="#8B5CF6" 
            strokeWidth={4} 
            dot={{ r: 0 }} 
            activeDot={{ r: 6, strokeWidth: 4, stroke: "#8B5CF6", fill: "#0B1218" }} 
            name="Net Surplus" 
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

