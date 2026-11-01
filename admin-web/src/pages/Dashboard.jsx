import React, { useState, useEffect } from "react";
import api from "../api/client";
import {
  Users,
  UserCheck,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import AttendanceDetailModal from "../components/AttendanceDetailModal";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/attendance/stats");
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500 font-medium">
        Loading live dashboard telemetry...
      </div>
    );
  }

  const kpis = [
    {
      title: "Registered Employees",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "blue",
      sub: `${stats?.activeUsers || 0} active`,
    },
    {
      title: "Currently Checked In",
      value: stats?.currentlyCheckedIn || 0,
      icon: Clock,
      color: "emerald",
      sub: "Active on sites",
    },
    {
      title: "Today's Check-Ins",
      value: stats?.todayCheckIns || 0,
      icon: LogIn,
      color: "indigo",
      sub: "Total logins today",
    },
    {
      title: "Today's Check-Outs",
      value: stats?.todayCheckOuts || 0,
      icon: LogOut,
      color: "slate",
      sub: "Completed visits",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time employee check-in telemetry, geo-tracking, and attendance metrics
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm transition"
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                  {kpi.value}
                </h3>
                <span className="text-xs text-slate-500 mt-1 block">
                  {kpi.sub}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Attendance Trends */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Attendance Activity (Past 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison between daily check-ins and completed visits
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.sevenDayTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Bar dataKey="checkIns" name="Check-Ins" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="checkOuts" name="Check-Outs" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Destination Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <span>Top Destinations</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Locations receiving most check-ins
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {stats?.destinationStats && stats.destinationStats.length > 0 ? (
              stats.destinationStats.map((dest, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="overflow-hidden pr-2">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {dest.name}
                    </p>
                    <p className="text-[11px] text-slate-400">Total Visits</p>
                  </div>
                  <span className="font-bold text-blue-600 text-sm bg-blue-50 px-2.5 py-1 rounded-lg">
                    {dest.count}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No destination telemetry recorded yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">
            Recent Attendance Feed
          </h3>
          <span className="text-xs font-semibold text-blue-600">
            Live Stream
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Destination</th>
                <th className="px-6 py-3.5">Check-In Time</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentRecords && stats.recentRecords.length > 0 ? (
                stats.recentRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">
                        {r.userId?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.userId?.employeeId} • {r.userId?.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {r.destinationId?.name || r.customDestination || "Custom"}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">
                        {r.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      {new Date(r.checkIn.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === "checked_out"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-emerald-100 text-emerald-800 animate-pulse"
                        }`}
                      >
                        {r.status === "checked_out" ? "Checked Out" : "Checked In"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRecordId(r._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                      >
                        <span>Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View */}
      {selectedRecordId && (
        <AttendanceDetailModal
          recordId={selectedRecordId}
          onClose={() => setSelectedRecordId(null)}
        />
      )}
    </div>
  );
}
