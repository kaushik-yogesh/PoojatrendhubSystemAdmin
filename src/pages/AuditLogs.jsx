import React, { useState, useEffect, useCallback } from "react";
import { fetchDataFromApi } from "../utils/api";
import {
  MdOutlineRefresh,
  MdOutlineSearch,
  MdOutlinePerson,
  MdOutlineAdminPanelSettings,
  MdOutlineHistory
} from "react-icons/md";

const ACTION_COLORS = {
  USER_SUSPENDED: "badge-red",
  USER_ACTIVATED: "badge-green",
  SELLER_APPROVED: "badge-green",
  SELLER_REJECTED: "badge-red",
  ROLE_CHANGED: "badge-blue",
  MAINTENANCE_TOGGLED: "badge-amber",
  BLOG_PUBLISHED: "badge-violet",
  BLOG_DELETED: "badge-red",
  CATEGORY_CREATED: "badge-blue",
  CATEGORY_DELETED: "badge-red"
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", { hour12: true });
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const res = await fetchDataFromApi("/api/system/audit-logs?limit=200");
    if (!res.error && res.logs) {
      setLogs(res.logs);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logic
  useEffect(() => {
    let result = [...logs];

    if (actionFilter !== "ALL") {
      result = result.filter((l) => l.action === actionFilter);
    }

        if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action?.toLowerCase().includes(q) ||
          l.adminId?.email?.toLowerCase().includes(q) ||
          l.adminId?.name?.toLowerCase().includes(q) ||
          l.targetId?.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [logs, search, actionFilter]);

  // Get unique actions for filter buttons
  const uniqueActions = ["ALL", ...Array.from(new Set(logs.map((l) => l.action).filter(Boolean))).slice(0, 8)];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Audit Logs</h1>
          <p className="page-subtitle">Complete history of all admin actions and system events.</p>
        </div>
        <button onClick={fetchLogs} className="btn-ghost">
          <MdOutlineRefresh size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Actions",
            value: logs.length,
            icon: <MdOutlineHistory size={20} />,
            color: "text-violet-400",
            bg: "bg-violet-500/10 border-violet-500/20"
          },
          {
            label: "Unique Admins",
            value: new Set(logs.map((l) => l.adminId)).size,
            value: new Set(logs.map((l) => l.adminId?._id || l.adminId)).size,
            icon: <MdOutlineAdminPanelSettings size={20} />,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20"
          },
          {
            label: "Today's Actions",
            value: logs.filter((l) => {
              const d = new Date(l.createdAt);
              const now = new Date();
              return d.toDateString() === now.toDateString();
            }).length,
            icon: <MdOutlinePerson size={20} />,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20"
          },
          {
            label: "Action Types",
            value: uniqueActions.length - 1,
            icon: <MdOutlineSearch size={20} />,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20"
          }
        ].map((item, idx) => (
          <div key={idx} className="glass-panel glow-card p-4 rounded-2xl flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${item.bg} ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            className="admin-input !pl-9 !h-9 text-xs"
            placeholder="Search action, admin email, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {uniqueActions.map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                actionFilter === action
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {action.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-500 font-medium">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/40">
        <div className="overflow-x-auto" style={{ maxHeight: "560px", overflowY: "auto" }}>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              Loading audit records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
              No audit records found.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, idx) => (
                  <tr
                    key={log._id || idx}
                    onClick={() => setSelectedLog(log)}
                    className="cursor-pointer"
                  >
                    <td className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td>
                      <span className={`badge ${ACTION_COLORS[log.action] || "badge-slate"}`}>
                        {log.action?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{log.adminId?.name || "Admin"}</div>
                        <div className="text-[10px] text-slate-500">{log.adminId?.email || log.adminEmail}</div>
                      </div>
                    </td>
                    <td className="font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={log.targetId}>
                      {log.targetId || "-"}
                    </td>
                    <td className="text-[11px] text-slate-300 max-w-[240px] truncate" title={log.details}>
                      {log.details || "-"}
                    </td>
                    <td className="font-mono text-[10px] text-slate-500">{log.ipAddress || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-box max-w-[520px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100">Audit Log Detail</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(selectedLog.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-700/60 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Action", value: selectedLog.action?.replace(/_/g, " ") },
                  { label: "Admin Name", value: selectedLog.adminId?.name || selectedLog.adminName || "N/A" },
                  { label: "Admin Email", value: selectedLog.adminId?.email || selectedLog.adminEmail || "N/A" },
                  { label: "Target ID", value: selectedLog.targetId || "N/A" },
                  { label: "IP Address", value: selectedLog.ipAddress || "N/A" },
                  { label: "User Agent", value: selectedLog.userAgent?.substring(0, 40) + "..." || "N/A" }
                ].map((field) => (
                  <div key={field.label} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">{field.label}</p>
                    <p className="text-xs font-medium text-slate-200 break-all">{field.value}</p>
                  </div>
                ))}
              </div>

              {selectedLog.details && (
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Details</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedLog.details}</p>
                </div>
              )}

              {selectedLog.previousState && (
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Previous State</p>
                  <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.previousState, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
