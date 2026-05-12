"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/lib/utils";

const CAMPAIGN_DATA = [
  { name: "Activas", value: 2, color: "#B8EB23" },
  { name: "En revisión", value: 1, color: "#F59E0B" },
  { name: "Borrador", value: 1, color: "#3B82F6" },
  { name: "Pausadas", value: 1, color: "#EF4444" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.color }} />
        <span className="text-xs text-white font-semibold">{payload[0].name}</span>
        <span className="text-xs text-white/50">{payload[0].value}</span>
      </div>
    </div>
  );
};

export function CampaignStatusChart() {
  return (
    <div className="flex items-center gap-6">
      <div className="w-24 h-24 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={CAMPAIGN_DATA}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={44}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {CAMPAIGN_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {CAMPAIGN_DATA.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-xs text-white/60">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
