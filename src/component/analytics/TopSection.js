'use client';

import { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const API_URL = "https://matrimonial-backend-7ahc.onrender.com";

const WEEK_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_LABELS = { Sun:"Su", Mon:"Mo", Tue:"Tu", Wed:"We", Thu:"Th", Fri:"Fr", Sat:"Sa" };

export default function DashboardFinal() {

  const [yellowTrend, setYellowTrend] = useState([]);
  const [greenTrend, setGreenTrend] = useState([]);
  const [funnelData, setFunnel] = useState([]);

  /* -----------------------------------
       FETCH RUNNING USER TREND API
  ------------------------------------*/
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/admin/user-signup-trends`);
      const json = await res.json();

      if (!json.success) return;

      const yellowBucket = {};
      const greenBucket = {};

      json.data.forEach((d) => {
        yellowBucket[d.date] = Number(d.newUsers || 0);
        greenBucket[d.date] = Number(d.returningUsers || 0);
      });

      const orderedYellow = WEEK_ORDER.map((day) => yellowBucket[day] || 0);
      const orderedGreen  = WEEK_ORDER.map((day) => greenBucket[day] || 0);

      setYellowTrend(orderedYellow);
      setGreenTrend(orderedGreen);
    })();
  }, []);

  /* -----------------------------------
        FETCH SEARCH TO MATCH
  ------------------------------------*/
  useEffect(() => {
    (async () => {
      const res = await fetch(`${API_URL}/admin/search-to-match`);
      const json = await res.json();
      if (json.success) setFunnel(json.data);
    })();
  }, []);

  /* -----------------------------------
        REAL API DATA → DIRECT CHART
  ------------------------------------*/

  const yellowData = yellowTrend;      // NO MULTIPLIER
  const greenData  = greenTrend;       // NO MULTIPLIER

  /* -----------------------------------
        HIGHCHART UI SAME
  ------------------------------------*/
  const chartOptions = {
    chart: {
      type: "line",
      height: 310,
      backgroundColor: "transparent",
      spacingLeft: 10,
      spacingRight: 10,
      spacingTop: 15,
      spacingBottom: 25,
    },

    credits: { enabled: false },
    title: { text: "" },
    legend: { enabled: false },

    xAxis: {
      categories: WEEK_ORDER.map((d) => WEEK_LABELS[d]),
      tickLength: 0,
      labels: {
        style: { fontSize: "14px", fontWeight: 600, color: "#4b5563" },
        y: 20,
      },
    },

    yAxis: {
      title: null,
      min: 0,
      max: Math.max(...yellowData, ...greenData, 5),
      tickPositions: [0, 5, 10, 15, 20, 25,30],
      labels: {
        formatter() { return this.value; },
        style: { fontSize: "13px", fontWeight: 500, color: "#6b7280" },
      },
    },

    plotOptions: {
      series: {
        lineWidth: 3,
        marker: {
          radius: 6,
          fillColor: "#fff",
          lineWidth: 3,
        },
      },
    },

    tooltip: {
      shared: true,
      backgroundColor: "#fff",
      borderRadius: 10,
      borderWidth: 1,
      style: { fontSize: "13px" },
    },

    series: [
      {
        name: "New Registered Users",
        data: yellowData,
        color: "#facc15",
        marker: { lineColor: "#facc15" },
      },
      {
        name: "Returning Users",
        data: greenData,
        color: "#16a34a",
        marker: { lineColor: "#16a34a" },
      },
    ],
  };

  /* -----------------------------------
       FIXED UI - RESPONSIVE
  ------------------------------------*/
  return (
    <div className="mt-24 px-4 md:px-6 w-full max-w-[100vw] overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch max-w-full">
        
        {/* LEFT — SEARCH TO MATCH */}
        <div className="bg-white rounded-[32px] shadow-xl border border-gray-300 p-4 md:p-6 w-full lg:w-[45%] h-full max-w-full overflow-hidden">
          <h2 className="text-xl md:text-2xl font-bold mb-6 md:mb-8">Search To Match</h2>

          <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-auto">
            {funnelData.map((item, index) => {
              const max = funnelData[0]?.value || 1;
              const pct = (item.value / max) * 100;

              return (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full max-w-full">
                  
                  {/* Stage Name - Fixed Width */}
                  <div className="w-full sm:w-[160px] md:w-[180px] text-sm md:text-base font-semibold text-gray-800 truncate">
                    {item.stage}
                  </div>

                  {/* Progress Bar - Flexible */}
                  <div className="w-full sm:flex-1 mx-0 sm:mx-4 min-w-0">
                    <div className="w-full h-[28px] md:h-[32px] bg-gray-200 rounded-full overflow-hidden"
                      style={{
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.18), inset 0 -2px 4px rgba(255,255,255,0.4)",
                      }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg,#3A47FF,#001BFF)",
                          borderRadius: 18,
                          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Value - Fixed Width */}
                  <div className="w-full sm:w-[80px] md:w-[100px] text-right text-base md:text-lg font-semibold text-gray-900">
                    {item.value}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — RUNNING USER TREND */}
        <div className="bg-white rounded-[32px] shadow-xl border border-gray-300 p-4 md:p-6 w-full lg:w-[55%] h-full max-w-full overflow-hidden">
          
          {/* Header + Legends - Responsive */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4 md:mb-6 max-w-full">
            
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 whitespace-nowrap">
              Running User Trend
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-gray-700 text-xs font-semibold max-w-full">
              
              <div className="flex items-center gap-1 flex-nowrap">
                <span className="hidden md:inline" style={{ width: 8, height: 4, background: "#facc15", borderRadius: 4 }}></span>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "3px solid #facc15",
                  background: "#fff"
                }}></span>
                <span className="hidden md:inline" style={{ width: 8, height: 4, background: "#facc15", borderRadius: 4 }}></span>
                <span className="text-xs md:text-sm">New Registered Users</span>
              </div>

              <div className="flex items-center gap-1 flex-nowrap">
                <span className="hidden md:inline" style={{ width: 8, height: 4, background: "#16a34a", borderRadius: 4 }}></span>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  border: "3px solid #16a34a",
                  background: "#fff"
                }}></span>
                <span className="hidden md:inline" style={{ width: 8, height: 4, background: "#16a34a", borderRadius: 4 }}></span>
                <span className="text-xs md:text-sm">Returning Users</span>
              </div>

            </div>

          </div>

          {/* Chart Container */}
          <div className="w-full max-w-full overflow-auto">
            <div className="min-w-[500px] md:min-w-0">
              <HighchartsReact 
                highcharts={Highcharts} 
                options={chartOptions} 
                containerProps={{ style: { width: '100%', maxWidth: '100%' } }}
              />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}