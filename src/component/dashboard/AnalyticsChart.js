"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AnalyticsPage() {
  const API =
    "https://merimonial-backend.onrender.com/admin/getByGender";

  // Month list
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Backend month abbreviations (3‑letter lowercase)
  const ABBR_MAP = {
    January: "jan",
    February: "feb",
    March: "mar",
    April: "apr",
    May: "may",
    June: "jun",
    July: "jul",
    August: "aug",
    September: "sep",
    October: "oct",
    November: "nov",
    December: "dec",
  };

  // Helper to get previous month
  function getPrevMonth(m) {
    const i = MONTHS.indexOf(m);
    return i === 0 ? "December" : MONTHS[i - 1];
  }

  // Get current month from system
  function getCurrentMonth() {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    return MONTHS[currentMonthIndex];
  }

  // States
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [previousMonth, setPreviousMonth] = useState(
    getPrevMonth(getCurrentMonth())
  );
  const [genderData, setGenderData] = useState([]);
  const [matchData, setMatchData] = useState([]);
  const [signInData, setSignInData] = useState([]);
  const [totalSignIn, setTotalSignIn] = useState(0);
  const [percentGrowth, setPercentGrowth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  // Load data when selectedMonth changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      const prev = getPrevMonth(selectedMonth);
      setPreviousMonth(prev);

      const backendMonth = ABBR_MAP[selectedMonth]; // e.g., "mar"

      try {
        const res = await fetch(
          `${API}?month=${backendMonth}&year=2025`
        );
        const json = await res.json();

        if (!mounted) return;

        setGenderData(json.genderData || []);
        setMatchData(json.matchData || []);

        // --- Transform signInData to use currentMonth / previousMonth ---
        const currentMonthField = ABBR_MAP[selectedMonth]; // e.g., "mar"
        const previousMonthField = ABBR_MAP[prev]; // e.g., "feb"

        const transformedSignIn = (json.signInData || []).map((day) => ({
          day: day.day,
          currentMonth: day[currentMonthField] ?? 0,
          previousMonth: day[previousMonthField] ?? 0,
        }));
        setSignInData(transformedSignIn);

        // --- Calculate totals and growth ---
        const currentTotal = transformedSignIn.reduce(
          (sum, d) => sum + d.currentMonth,
          0
        );
        const previousTotal = transformedSignIn.reduce(
          (sum, d) => sum + d.previousMonth,
          0
        );
        setTotalSignIn(currentTotal);

        let growth = 0;
        if (previousTotal > 0) {
          growth = ((currentTotal - previousTotal) / previousTotal) * 100;
        } else if (currentTotal > 0) {
          growth = 100; // from zero to something
        }
        setPercentGrowth(Math.round(growth));
      } catch (err) {
        console.error("API error:", err);
      }

      setLoading(false);
    })();

    return () => (mounted = false);
  }, [selectedMonth]);

  // Colors
  const genderColors = {
    Male: "#34D399",
    Female: "#FDE047",
    Others: "#F87171",
  };
  const matchColors = {
    "Still Looking": "#10B981",
    "Successfully Matched": "#FB923C",
    "Newly Registered": "#06B6D4",
    Inactive: "#FBBF24",
  };

  // 3D PIE HELPER (fixed for full circle)
  function build3DSlices(data = [], cx, cy, r, h) {
    const total = Math.max(1, data.reduce((t, a) => t + (a.value || 0), 0));
    let start = -Math.PI / 2 + 0.2;

    return data.map((item) => {
      const angle = (item.value / total) * Math.PI * 2;
      const end = start + angle;

      let topPath;
      let sidePath;

      // Special case: full circle (angle ≈ 2π)
      if (Math.abs(angle - Math.PI * 2) < 0.0001) {
        // Draw a complete circle as top, and a ring as side
        topPath = `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} Z`;
        sidePath = `M ${cx + r} ${cy} L ${cx + r} ${cy + h} A ${r} ${r} 0 1 1 ${cx - r} ${cy + h} L ${cx - r} ${cy} Z`;
      } else {
        const x1 = cx + r * Math.cos(start);
        const y1 = cy + r * Math.sin(start);
        const x2 = cx + r * Math.cos(end);
        const y2 = cy + r * Math.sin(end);

        const largeArc = angle > Math.PI ? 1 : 0;

        topPath = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        sidePath = `M ${x1} ${y1} L ${x1} ${y1 + h} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2 + h} L ${x2} ${y2} Z`;
      }

      start = end;

      return {
        ...item,
        percent: Math.round((item.value / total) * 100),
        topPath,
        sidePath,
      };
    });
  }

  const genderSlices = build3DSlices(genderData, 150, 120, 110, 24);
  const matchSlices = build3DSlices(matchData, 150, 150, 110, 30);

  const xTicks = ["01", "05", "10", "15", "20", "25", "30"];
  const yTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];

  // Custom tooltip for line chart
  function LineTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: "#111827",
          color: "#fff",
          padding: 10,
          borderRadius: 8,
        }}
      >
        <b>Day {label}</b>
        <div>{payload[0].value}</div>
      </div>
    );
  }

  // Hover handlers for 3D pie
  function handleSliceEnter(e, slice) {
    setHover({
      ...slice,
      x: e.clientX + 10,
      y: e.clientY - 70,
    });
  }
  function handleSliceMove(e, slice) {
    setHover({
      ...slice,
      x: e.clientX + 10,
      y: e.clientY - 70,
    });
  }
  function handleSliceLeave() {
    setHover(null);
  }

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-100">
      <div className="flex flex-col xl:flex-row gap-8 max-w-[1250px] mx-auto">
        {/* LEFT: Sign-In Analytics (Line Chart) */}
        <div className="bg-white rounded-2xl shadow-lg border h-[700px] p-6 w-full xl:w-[700px]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Sign-In Analytics</h2>
              <div className="flex items-end gap-4 mt-2">
                <div className="text-4xl font-extrabold">{totalSignIn}</div>
                <div className="bg-green-100 border border-green-400 px-3 py-1 rounded-lg text-green-700 font-semibold flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>↑</span> {percentGrowth}%
                </div>
                <div className="text-gray-600 font-medium">Vs Last Month</div>
              </div>
            </div>

            {/* MONTH SELECTOR */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-lg">
                <div className="w-3 h-3 rounded-full bg-black"></div>
                {selectedMonth}
              </div>
              <div className="flex items-center gap-2 text-lg">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                {previousMonth}
              </div>
              <select
                className="border rounded-xl px-4 py-2"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {MONTHS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LINE CHART */}
          <div className="w-full h-[540px] mt-2">
            <ResponsiveContainer>
              <LineChart data={signInData}>
                <CartesianGrid stroke="#e6e6e6" strokeDasharray="4 4" />
                <XAxis dataKey="day" ticks={xTicks} />
                <YAxis ticks={yTicks} />
                <ReTooltip content={<LineTooltip />} />
                <Line
                  dataKey="currentMonth"
                  stroke="#000"
                  strokeWidth={3}
                  dot
                />
                <Line
                  dataKey="previousMonth"
                  stroke="#9ca3af"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RIGHT: Gender and Matchmaking Charts */}
        <div className="flex flex-col gap-8 w-full xl:w-[500px]">
          {/* GENDER PIE */}
          <div className="bg-white rounded-2xl shadow-lg border p-4 relative h-[330px] w-full">
            {hover && (
              <div
                style={{
                  position: "fixed",
                  left: hover.x,
                  top: hover.y,
                  zIndex: 9999,
                  background: "#111827",
                  color: "#fff",
                  padding: 10,
                  borderRadius: 6,
                }}
              >
                <b>{hover.name}</b>
                <div>{hover.percent}%</div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Gender Analytics</h3>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `12px solid ${genderColors.Male}`,
                    }}
                  ></div>{" "}
                  Male
                </div>
                <div className="flex items-center gap-1">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `12px solid ${genderColors.Female}`,
                    }}
                  ></div>{" "}
                  Female
                </div>
                <div className="flex items-center gap-1">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `12px solid ${genderColors.Others}`,
                    }}
                  ></div>{" "}
                  Ots.
                </div>
              </div>
            </div>

            <svg
              width="100%"
              height="280"
              viewBox="0 0 400 280"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform="translate(80, 16)">
                {genderSlices.map((s, i) => (
                  <path
                    key={i}
                    d={s.sidePath}
                    fill={genderColors[s.name]}
                    opacity="0.66"
                  />
                ))}

                {genderSlices.map((s, i) => (
                  <g
                    key={i}
                    onMouseEnter={(e) => handleSliceEnter(e, s)}
                    onMouseMove={(e) => handleSliceMove(e, s)}
                    onMouseLeave={handleSliceLeave}
                  >
                    <path
                      d={s.topPath}
                      fill={genderColors[s.name]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  </g>
                ))}
              </g>
            </svg>
          </div>

          {/* MATCHMAKING PIE */}
          <div className="bg-white rounded-2xl shadow-lg border p-4 relative h-[340px] w-full overflow-hidden">
            {hover && (
              <div
                style={{
                  position: "fixed",
                  left: hover.x,
                  top: hover.y,
                  zIndex: 99999,
                  background: "#111827",
                  color: "#fff",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <b>{hover.name}</b>
                <div>{hover.percent}%</div>
              </div>
            )}

            <div className="flex justify-between items-start">
              <h3 className="text-2xl font-bold">Matchmaking Status</h3>
              <div className="space-y-1">
                {Object.keys(matchColors).map((k) => (
                  <div key={k} className="flex items-center gap-1">
                    <div
                      style={{
                        width: 16,
                        height: 18,
                        borderRadius: 8,
                        border: `10px solid ${matchColors[k]}`,
                      }}
                    ></div>
                    <div className="text-[14px] font-bold">{k}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute left-1/3 top-[51%] -translate-x-1/2 -translate-y-1/2">
              <svg
                width="400"
                height="320"
                viewBox="0 0 400 320"
                preserveAspectRatio="xMidYMid meet"
              >
                <g transform="translate(60, 28)">
                  {matchSlices.map((s, i) => (
                    <path
                      key={i}
                      d={s.sidePath}
                      fill={matchColors[s.name]}
                      opacity="0.65"
                    />
                  ))}

                  {matchSlices.map((s, i) => (
                    <g
                      key={i}
                      onMouseEnter={(e) => handleSliceEnter(e, s)}
                      onMouseMove={(e) => handleSliceMove(e, s)}
                      onMouseLeave={handleSliceLeave}
                    >
                      <path
                        d={s.topPath}
                        fill={matchColors[s.name]}
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    </g>
                  ))}

                  <circle cx="150" cy="150" r="48" fill="#fff" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}