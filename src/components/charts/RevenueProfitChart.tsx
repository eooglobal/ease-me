"use client";

import React, { useState } from "react";
import { TrendingUp, Calendar, ArrowUpRight } from "lucide-react";

interface DayData {
  day: string;
  revenue: number;
  cogs: number;
  expenses: number;
}

export function RevenueProfitChart() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const weeklyData: DayData[] = [
    { day: "Mon", revenue: 310000, cogs: 195000, expenses: 22000 },
    { day: "Tue", revenue: 285000, cogs: 175000, expenses: 18000 },
    { day: "Wed", revenue: 360000, cogs: 225000, expenses: 24000 },
    { day: "Thu", revenue: 340000, cogs: 210000, expenses: 20000 },
    { day: "Fri", revenue: 420000, cogs: 260000, expenses: 31000 },
    { day: "Sat", revenue: 510000, cogs: 320000, expenses: 38000 },
    { day: "Sun (Today)", revenue: 412000, cogs: 258000, expenses: 32000 },
  ];

  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue));

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-4 space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              7-Day Revenue & Net Profit Trend
            </h3>
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight size={11} />
              +14.8%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Daily comparative performance: Sales Revenue vs. Estimated Net Profit
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-slate-600 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Net Profit</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="pt-1">
        <div className="h-40 flex items-end justify-between gap-2 sm:gap-3 px-2">
          {weeklyData.map((d, idx) => {
            const profit = d.revenue - d.cogs - d.expenses;
            const revHeight = (d.revenue / maxRevenue) * 100;
            const profitHeight = (profit / maxRevenue) * 100;
            const isHovered = hoveredDay?.day === d.day;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 bg-slate-900 text-white rounded-md px-2 py-1 text-[10px] shadow-sm whitespace-nowrap pointer-events-none animate-in fade-in duration-150">
                    <p className="font-semibold text-slate-200">{d.day}</p>
                    <div className="flex items-center gap-1.5 num-mono text-[9px] mt-0.5">
                      <span className="text-orange-300">Rev: ₦{d.revenue.toLocaleString()}</span>
                      <span>•</span>
                      <span className="text-emerald-300">Profit: ₦{profit.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* Bars Container */}
                <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full pb-1">
                  {/* Revenue Bar */}
                  <div
                    style={{ height: `${revHeight}%` }}
                    className={`w-1/2 rounded-t-xs transition-all duration-200 ${
                      isHovered ? "bg-orange-600" : "bg-orange-500/80 group-hover:bg-orange-500"
                    }`}
                  />
                  {/* Profit Bar */}
                  <div
                    style={{ height: `${profitHeight}%` }}
                    className={`w-1/2 rounded-t-xs transition-all duration-200 ${
                      isHovered ? "bg-emerald-600" : "bg-emerald-500/80 group-hover:bg-emerald-500"
                    }`}
                  />
                </div>

                {/* Day Label */}
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors ${
                    idx === weeklyData.length - 1
                      ? "text-orange-600 font-bold"
                      : isHovered
                      ? "text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  {d.day.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-md">
          <span className="text-[10px] text-slate-500 font-medium">7-Day Gross Revenue</span>
          <p className="font-bold text-slate-900 num-mono mt-0.5">
            ₦{weeklyData.reduce((s, i) => s + i.revenue, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-md">
          <span className="text-[10px] text-slate-500 font-medium">7-Day Total COGS</span>
          <p className="font-bold text-slate-700 num-mono mt-0.5">
            ₦{weeklyData.reduce((s, i) => s + i.cogs, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-md">
          <span className="text-[10px] text-slate-500 font-medium">7-Day Net Profit</span>
          <p className="font-bold text-emerald-600 num-mono mt-0.5">
            ₦{weeklyData.reduce((s, i) => s + (i.revenue - i.cogs - i.expenses), 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
