'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { API_URL } from '../api/apiURL';

export default function ReportsThisWeek() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/admin/reports-this-week`);
        const json = await res.json();
        if (json.success) setReportData(json.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-4 sm:p-6 mx-auto w-full max-w-full overflow-x-hidden">
      
      {/* CARD CONTAINER EXACT LIKE IMAGE */}
      <div
        className="rounded-[24px] p-4 md:p-6 lg:p-8 w-full"
        style={{
          background: "#FFFFFF",
          border: "1px solid #D6D6D6",
          boxShadow: "0px 6px 18px rgba(0,0,0,0.12)",
        }}
      >

        {/* TITLE + LEGEND - RESPONSIVE */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 w-full">
          
          <h3 className="text-xl sm:text-2xl lg:text-[26px] font-semibold text-gray-900 whitespace-nowrap">
            Reports This Week
          </h3>

          {/* LEGEND - WRAPS NICELY */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-7 text-sm sm:text-base lg:text-[16px] font-medium text-gray-800">
            <LegendBox label="Fake" color="#FF7C7C" />
            <LegendBox label="Inappropriate profile" color="#FFC400" />
            <LegendBox label="Spam" color="#76D64C" />
            <LegendBox label="Harassment" color="#47D0FF" />
          </div>
          
        </div>

        {/* CHART CONTAINER - FIXED OVERFLOW */}
        {loading ? (
          <div className="w-full h-[300px] sm:h-[380px] lg:h-[420px] flex items-center justify-center">
            <p className="text-gray-600 text-lg">Loading...</p>
          </div>
        ) : (
          <div className="w-full h-[300px] sm:h-[380px] lg:h-[420px] min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reportData}
                margin={{ 
                  top: 20, 
                  right: 20, 
                  left: -10, 
                  bottom: 20 
                }}
                barCategoryGap={16}
                barGap={2}
              >
                {/* GRID LIKE IMAGE */}
                <CartesianGrid
                  stroke="#D8D8D8"
                  strokeWidth={1}
                  horizontal={true}
                  vertical={false}
                />

                {/* X Axis - Responsive */}
                <XAxis
                  dataKey="day"
                  tick={{ 
                    fill: "#4B4B4B", 
                    fontSize: 12,
                    fontWeight: 500 
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "#D8D8D8", strokeWidth: 1 }}
                />

                {/* Y Axis with % - Adjusted */}
                <YAxis
                  domain={[0, 70]}
                  ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ 
                    fill: "#4B4B4B", 
                    fontSize: 12,
                    fontWeight: 500 
                  }}
                  tickLine={false}
                  axisLine={{ stroke: "#D8D8D8", strokeWidth: 1 }}
                  width={45}
                />

                {/* TOOLTIP */}
                <Tooltip
                  formatter={(v) => `${v}%`}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #ccc",
                    background: "#ffffff",
                    fontSize: "14px",
                    padding: "12px",
                    boxShadow: "0 2px 14px rgba(0,0,0,0.15)",
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />

                {/* STACKED BARS - Adjusted width */}
                <Bar 
                  dataKey="fake" 
                  stackId="a" 
                  fill="#FF7C7C" 
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                >
                  {/* TOP LABELS - Only show if value > 0 */}
                  <LabelList 
                    dataKey="fake" 
                    formatter={(v) => v > 0 ? `${v}%` : ''} 
                    fill="#000" 
                    position="top"
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>

                <Bar 
                  dataKey="inappropriate" 
                  stackId="a" 
                  fill="#FFC400" 
                  barSize={24}
                />
                
                <Bar 
                  dataKey="spam" 
                  stackId="a" 
                  fill="#76D64C" 
                  barSize={24}
                />
                
                <Bar 
                  dataKey="harassment" 
                  stackId="a" 
                  fill="#47D0FF" 
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

/* LEGEND ITEM - Compact */
function LegendBox({ label, color }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "4px",
          background: color,
          border: `2px solid ${color}`,
          flexShrink: 0
        }}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}