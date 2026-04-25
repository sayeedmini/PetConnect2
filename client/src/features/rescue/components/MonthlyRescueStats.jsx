import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API);
const API_BASE_URL = `${API}/api/reports`;

function MonthlyRescueStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_BASE_URL}/monthly-stats`);
        setStats(response.data || []);
      } catch (err) {
        console.error("Failed to fetch monthly stats:", err);
        setError("Failed to load monthly rescue statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyStats();

    socket.on("new_rescue_request", fetchMonthlyStats);
    socket.on("rescue_status_updated", fetchMonthlyStats);
    socket.on("rescue_completed", fetchMonthlyStats);
    socket.on("success_story_added", fetchMonthlyStats);

    return () => {
      socket.off("new_rescue_request", fetchMonthlyStats);
      socket.off("rescue_status_updated", fetchMonthlyStats);
      socket.off("rescue_completed", fetchMonthlyStats);
      socket.off("success_story_added", fetchMonthlyStats);
    };
  }, []);

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, item) => {
        acc.totalRescues += item.totalRescues || 0;
        acc.completedRescues += item.completedRescues || 0;
        acc.rejectedRescues += item.rejectedRescues || 0;
        return acc;
      },
      {
        totalRescues: 0,
        completedRescues: 0,
        rejectedRescues: 0,
      }
    );
  }, [stats]);

  const handleExportCSV = () => {
    if (!stats.length) return;

    const headers = [
      "Month",
      "Year",
      "Month Number",
      "Total Rescues",
      "Completed Rescues",
      "Rejected Rescues",
    ];

    const rows = stats.map((item) => [
      item.month,
      item.year,
      item.monthNumber,
      item.totalRescues,
      item.completedRescues,
      item.rejectedRescues,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "monthly_rescue_statistics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        marginTop: "24px",
        padding: "24px",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "24px",
            fontWeight: "700",
            color: "#1f2937",
          }}
        >
          Monthly Rescue Statistics
        </h2>

        <button
          onClick={handleExportCSV}
          disabled={!stats.length}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            background: isHover ? "#1d68d8" : "#257eeb",
            color: "#fff",
            fontSize: "14px",
            fontWeight: "600",
            cursor: stats.length ? "pointer" : "not-allowed",
            opacity: stats.length ? 1 : 0.6,
            transition: "all 0.2s ease",
            transform: isHover ? "scale(1.05)" : "scale(1)",
            boxShadow: isHover
              ? "0 6px 16px rgba(37, 99, 235, 0.4)"
              : "none",
          }}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#fff" }}>Loading monthly statistics...</p>
      ) : error ? (
        <p style={{ color: "#ffdddd" }}>{error}</p>
      ) : !stats.length ? (
        <p style={{ color: "#fff" }}>No monthly rescue data found.</p>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#1f2937",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Total Rescues</p>
              <h3 style={{ margin: 0, fontSize: "28px" }}>{totals.totalRescues}</h3>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#1f2937",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Completed</p>
              <h3 style={{ margin: 0, fontSize: "28px" }}>{totals.completedRescues}</h3>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "rgba(255, 255, 255, 0.12)",
                color: "#1f2937",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Rejected</p>
              <h3 style={{ margin: 0, fontSize: "28px" }}>{totals.rejectedRescues}</h3>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: "320px",
              marginBottom: "28px",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalRescues" name="Total Rescues" fill="#60a5fa" />
                <Bar dataKey="completedRescues" name="Completed" fill="#34d399" />
                <Bar dataKey="rejectedRescues" name="Rejected" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default MonthlyRescueStats;
