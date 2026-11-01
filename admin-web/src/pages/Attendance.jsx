import React, { useState, useEffect } from "react";
import api, { API_BASE_URL } from "../api/client";
import {
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpRight,
  RefreshCw,
  MapPin,
  Clock,
  Camera,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import AttendanceDetailModal from "../components/AttendanceDetailModal";

function LocationCell({ lat, lng, address }) {
  if (!lat && !lng && !address) {
    return <span className="text-slate-400 italic text-xs">—</span>;
  }
  return (
    <div className="space-y-1 py-0.5 min-w-[220px] max-w-sm">
      <div className="text-[12px] font-mono text-slate-600">
        <span className="font-semibold text-slate-700">Latitude : </span>
        <span className="font-mono text-slate-800">{lat ? lat.toFixed(7) : "—"}</span>
      </div>
      <div className="text-[12px] font-mono text-slate-600">
        <span className="font-semibold text-slate-700">Longitude : </span>
        <span className="font-mono text-slate-800">{lng ? lng.toFixed(7) : "—"}</span>
      </div>
      <div className="text-[12px] leading-snug text-slate-700">
        <span className="font-semibold text-slate-700">Location : </span>
        <span className="font-medium text-slate-900">
          {address || (lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "—")}
        </span>
      </div>
      {lat && lng && (
        <div className="pt-1">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open in Google Maps</span>
          </a>
        </div>
      )}
    </div>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedRecordId, setSelectedRecordId] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get("/admin/attendance", { params });
      if (res.data.success) {
        setRecords(res.data.records);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to load attendance records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRecords();
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
    setTimeout(fetchRecords, 50);
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get("/admin/attendance/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance_report_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export attendance report: " + (err.message || "Error"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Records & Geo-Logs
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit employee arrival, departure, live photo captures, and GPS locations
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, ID, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="checked_in">Currently Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-slate-700"
            />
          </div>

          {/* Date Range End */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-slate-700"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Employee</th>
                <th className="px-5 py-3.5">Check In</th>
                <th className="px-5 py-3.5">Checkin Location</th>
                <th className="px-5 py-3.5">Check Out</th>
                <th className="px-5 py-3.5">Checkout Location</th>
                <th className="px-5 py-3.5">Duration</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => {
                  const cin = r.checkIn;
                  const cout = r.checkOut;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition">
                      {/* Employee */}
                      <td className="px-5 py-4 align-top">
                        <div className="font-bold text-slate-900 leading-tight">
                          {r.userId?.name || "Deleted User"}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {r.userId?.employeeId}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {r.userId?.department || "General"}
                        </div>
                        {r.destinationId?.name && (
                          <div className="text-[10px] text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 inline-block mt-1 font-medium">
                            {r.destinationId.name}
                          </div>
                        )}
                      </td>

                      {/* Check-In */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500 text-white shadow-sm">
                            {cin?.timestamp
                              ? new Date(cin.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </span>
                          {cin?.photoUrl && (
                            <button
                              onClick={() => setSelectedRecordId(r._id)}
                              title="View Check-In Photo"
                              className="p-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition shadow-sm"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {cin?.latitude && (
                            <button
                              onClick={() => setSelectedRecordId(r._id)}
                              title="View Location on Map"
                              className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-1">
                          {cin?.timestamp ? new Date(cin.timestamp).toLocaleDateString() : ""}
                        </div>
                      </td>

                      {/* Checkin Location */}
                      <td className="px-5 py-4 align-top">
                        <LocationCell
                          lat={cin?.latitude}
                          lng={cin?.longitude}
                          address={cin?.address}
                        />
                      </td>

                      {/* Check-Out */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        {cout?.timestamp ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white shadow-sm">
                                {new Date(cout.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {cout?.photoUrl && (
                                <button
                                  onClick={() => setSelectedRecordId(r._id)}
                                  title="View Check-Out Photo"
                                  className="p-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition shadow-sm"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {cout?.latitude && (
                                <button
                                  onClick={() => setSelectedRecordId(r._id)}
                                  title="View Location on Map"
                                  className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1">
                              {new Date(cout.timestamp).toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Checkout Location */}
                      <td className="px-5 py-4 align-top">
                        {cout ? (
                          <LocationCell
                            lat={cout.latitude}
                            lng={cout.longitude}
                            address={cout.address}
                          />
                        ) : (
                          <span className="text-slate-400 italic text-xs">Pending departure</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-4 align-top text-xs font-bold text-slate-800 whitespace-nowrap">
                        {r.durationMinutes !== null && r.durationMinutes !== undefined
                          ? `${r.durationMinutes} min`
                          : "Active"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.status === "checked_out"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-emerald-100 text-emerald-800 animate-pulse"
                          }`}
                        >
                          {r.status === "checked_out" ? "Checked Out" : "Checked In"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecordId(r._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <span>View & Map</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No matching attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Total: <b>{pagination.total}</b> records • Page <b>{page}</b> of{" "}
            <b>{pagination.totalPages || 1}</b>
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
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
