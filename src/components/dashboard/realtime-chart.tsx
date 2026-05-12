"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { cn, formatNumber } from "@/lib/utils";

interface RealtimeChartProps {
  data: Array<{
    date: string;
    impressions: number;
    clicks: number;
    engagements: number;
    qrScans: number;
  }>;
  className?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[160px]">
      <p className="text-xs text-white/50 mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            <span className="text-xs text-white/60">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-white">{formatNumber(entry.value, true)}</span>
        </div>
      ))}
    </div>
  );
};

export function RealtimeChart({ data, className }: RealtimeChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="impressions-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B8EB23" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#B8EB23" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicks-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="engagements-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatNumber(v, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="impressions"
            name="Impresiones"
            stroke="#B8EB23"
            strokeWidth={2}
            fill="url(#impressions-grad)"
            dot={false}
            activeDot={{ r: 4, fill: "#B8EB23", strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#3B82F6"
            strokeWidth={1.5}
            fill="url(#clicks-grad)"
            dot={false}
            activeDot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="engagements"
            name="Engagements"
            stroke="#A78BFA"
            strokeWidth={1.5}
            fill="url(#engagements-grad)"
            dot={false}
            activeDot={{ r: 4, fill: "#A78BFA", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
