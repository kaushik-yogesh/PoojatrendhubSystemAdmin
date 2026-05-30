import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchDataFromApi } from "../utils/api";
import {
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlineFilterList,
  MdCircle,
  MdOutlineTimer
} from "react-icons/md";

const METHOD_COLORS = {
  GET: "method-GET",
  POST: "method-POST",
  PUT: "method-PUT",
  DELETE: "method-DELETE",
  PATCH: "method-PATCH"
};

const getStatusClass = (status) => {
  if (!status) return "";
  if (status >= 200 && status < 300) return "status-2xx";
  if (status >= 300 && status < 400) return "status-3xx";
  if (status >= 400 && status < 500) return "status-4xx";
  if (status >= 500) return "status-5xx";
  return "";
};

const formatTime = (ms) => {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  return date.toLocaleString("en-IN", { hour12: true });
};

const LogsMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [errorFilter, setErrorFilter] = useState(false);
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);
  const logEndRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    const res = await fetchDataFromApi("/api/system/logs?limit=150");
    if (!res.error && res.logs) {
      setLogs(res.logs);
    }
    if (!res.error && res.stats) {
      setStats(res.stats);
    }
    setLoading(false);
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...logs];

    if (errorFilter) {
      result = result.filter((l) => l.statusCode >= 400);
    }

    if (methodFilter !== "ALL") {
      result = result.filter((l) => l.method === methodFilter);
    }

    if (statusFilter !== "ALL") {
      const range = parseInt(statusFilter);
      result = result.filter(
        (l) => l.statusCode >= range && l.statusCode < range + 100
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.url?.toLowerCase().includes(q) ||
          l.ip?.toLowerCase().includes(q) ||
          l.method?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [logs, search, methodFilter, statusFilter, errorFilter]);

  // Auto refresh
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 8000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchLogs]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Live API Logs</h1>
          <p className="page-subtitle">Real-time HTTP request monitoring and error tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800/60 rounded-xl">
            <MdCircle
              size={8}
              className={autoRefresh ? "text-green-400 blink" : "text-slate-600"}
            />
            <span className="text-xs font-semibold text-slate-400">
              {autoRefresh ? "Live" : "Paused"}
            </span>
          </div>
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`btn-ghost text-xs ${autoRefresh ? "!text-red-400 !border-red-500/20 hover:!bg-red-500/10" : "!text-green-400 !border-green-500/20 hover:!bg-green-500/10"}`}
          >
            {autoRefresh ? "Pause" : "Resume Live"}
          </button>
          <button onClick={fetchLogs} className="btn-ghost">
            <MdOutlineRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests (1h)", value: stats.totalRequests || 0, color: "text-violet-400" },
            { label: "Avg Response", value: formatTime(stats.avgDuration), color: "text-blue-400" },
            { label: "4xx Errors", value: stats.errorCount4xx || 0, color: "text-amber-400" },
            { label: "5xx Errors", value: stats.errorCount5xx || 0, color: "text-red-400" }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel glow-card p-4 rounded-2xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            className="admin-input !pl-9 !h-9 text-xs"
            placeholder="Search URL, IP, method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <MdOutlineFilterList size={14} className="text-slate-500" />
          <span className="text-xs text-slate-500 font-semibold">Method:</span>
          {["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                methodFilter === m
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          {["ALL", "200", "300", "400", "500"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                statusFilter === s
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {s === "ALL" ? "ALL" : `${s}s`}
            </button>
          ))}
        </div>

        <button
          onClick={() => setErrorFilter((v) => !v)}
          className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition-all ${
            errorFilter
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : "text-slate-500 border-slate-700/50 hover:text-red-400"
          }`}
        >
          Errors Only
        </button>

        <span className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} entries</span>
      </div>

      {/* Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/40">
        <div className="overflow-x-auto" style={{ maxHeight: "600px", overflowY: "auto" }}>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              Loading log entries...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              No log entries matching filters.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: "180px" }}>Timestamp</th>
                  <th style={{ width: "70px" }}>Method</th>
                  <th>URL</th>
                  <th style={{ width: "70px" }}>Status</th>
                  <th style={{ width: "90px" }}>Duration</th>
                  <th style={{ width: "140px" }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => (
                  <tr key={log._id || idx}>
                    <td className="font-mono text-[10px] text-slate-500">
                      {formatDate(log.createdAt || log.timestamp)}
                    </td>
                    <td>
                      <span className={`font-bold font-mono text-[10px] ${METHOD_COLORS[log.method] || "text-slate-400"}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-slate-300 max-w-[380px] truncate" title={log.url}>
                      {log.url}
                    </td>
                    <td>
                      <span className={`font-bold font-mono text-[11px] ${getStatusClass(log.statusCode)}`}>
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="font-mono text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <MdOutlineTimer size={11} />
                        {formatTime(log.duration)}
                      </span>
                    </td>
                    <td className="font-mono text-[10px] text-slate-500">{log.ip || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default LogsMonitor;
