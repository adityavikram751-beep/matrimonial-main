// src/component/analytics/ProfileMatch.jsx
"use client";

import dynamic from "next/dynamic";
import Highcharts from "highcharts";
import React, { useEffect, useState } from "react";
import { API_URL } from "../api/apiURL";

const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
});

export default function ProfileMatch() {
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const [pieData, setPieData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(new Array(12).fill(0));
  const [matches, setMatches] = useState(new Array(12).fill(0));

  /* ------------------ PIE DATA ------------------ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL + "/admin/overview");
        const api = await res.json();
        if (!api.success) return;

        const order = ["Completed", "Low", "Incomplete", "Moderate"];
        const colors = {
          Completed: "#0c7c1b",
          Low: "#f6931d",
          Incomplete: "#e21d1d",
          Moderate: "#f6c927",
        };

        setPieData(
          order.map((label) => {
            const found = api.data.find((x) => x.name === label);
            return { name: label, y: found ? found.value : 0, color: colors[label] };
          })
        );
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* ------------------ MATCH DATA ------------------ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL + "/admin/matches-per-month");
        const api = await res.json();
        if (!api.success) return;

        setTotalUsers(months.map((m) => api.data.find((x) => x.month === m)?.totalUsers || 0));
        setMatches(months.map((m) => api.data.find((x) => x.month === m)?.matches || 0));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  /* ------------------ PIE CHART ------------------ */
  const pieOptions = {
    chart: { type: "pie", backgroundColor: "transparent", height: 340 },
    title: { text: "" },
    legend: { enabled: false },
    plotOptions: {
      pie: {
        borderWidth: 7,
        borderColor: "#fff",
        shadow: { color: "rgba(0,0,0,0.28)", offsetY: 12, width: 22 },
        dataLabels: { enabled: false },
        startAngle: -30,
      },
    },
    series: [{ type: "pie", data: pieData }],
    credits: { enabled: false },
  };

  /* ------------------ MATCH CHART ------------------ */
  const matchOptions = {
    chart: { backgroundColor: "transparent", height: 420 },
    legend: { enabled: false },
    title: { text: "" },
    xAxis: {
      categories: months,
      labels: { style: { fontSize: 14, fontWeight: 600, color: "#444" } },
    },
    yAxis: {
      min: 0,
      max: 35,
      tickInterval: 5,
      labels: {
        formatter() { return this.value + " M"; },
        style: { fontWeight: 600, color: "#666" }
      },
      title: { text: "" },
    },
    series: [
      {
        type: "column",
        name: "Total no. of Users",
        borderRadius: 22,
        color: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, "#fadb4d"],
            [1, "#d2a103"],
          ],
        },
        data: totalUsers,
      },
      {
        type: "line",
        name: "No. Of Matches",
        color: "#e22c2c",
        marker: {
          enabled: true,
          fillColor: "#fff",
          radius: 6,
          lineWidth: 2.5,
          lineColor: "#e22c2c",
        },
        lineWidth: 4,
        data: matches,
      },
    ],
    credits: { enabled: false },
  };

  /* -------- EXACT SAME LEGEND BOX STYLE (SCREENSHOT PERFECT) -------- */
  const legendBox = (color) => ({
    width: 18,
    height: 18,
    background: "#fff",
    border: `3px solid ${color}`,
    borderRadius: 6,          // ← EXACT same as screenshot
    boxSizing: "border-box",
    display: "inline-block",
  });

  return (
    <div className="w-full p-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ----------- LEFT PIE BOX ----------- */}
        <div className="bg-white shadow-xl rounded-2xl p-6 relative"
          style={{ border: "2px solid rgba(0,0,0,0.08)" }}>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: "#222" }}>
            Profile Overview
          </h2>

          {/* RIGHT-SIDE LEGEND EXACT SAME AS SCREENSHOT */}
          <div style={{
            position: "absolute",
            top: 28,
            right: 28,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            fontSize: 16,
            fontWeight: 600,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={legendBox("#0c7c1b")} />
              Completed
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={legendBox("#f6931d")} />
              Low
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={legendBox("#e21d1d")} />
              Incomplete
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={legendBox("#f6c927")} />
              Moderate
            </div>
          </div>

          <div style={{ marginTop: 40 }}>
            <HighchartsReact highcharts={Highcharts} options={pieOptions} />
          </div>
        </div>

        {/* ----------- RIGHT MATCHES BOX ----------- */}
        <div className="bg-white shadow-xl rounded-2xl p-6"
          style={{ border: "2px solid rgba(0,0,0,0.08)" }}>

          {/* HEADER + LEGEND INLINE EXACT SAME */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#222" }}>
              Matches Per Month
            </h2>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 15,
              fontSize: 16,
              fontWeight: 600
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={legendBox("#d2a103")} />
                Total no. of Users
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={legendBox("#e22c2c")} />
                No. Of Matches
              </div>
            </div>
          </div>

          <div style={{ marginTop: 30 }}>
            <HighchartsReact highcharts={Highcharts} options={matchOptions} />
          </div>
        </div>

      </div>
    </div>
  );
}
