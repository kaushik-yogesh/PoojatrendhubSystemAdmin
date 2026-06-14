import React, { useState, useEffect } from "react";
import { fetchDataFromApi, postData } from "../utils/api";
import {
  MdOutlineComputer,
  MdOutlineSettingsInputAntenna,
  MdOutlineAttachMoney,
  MdOutlineShoppingCart,
  MdPeople,
  MdStore,
  MdOutlineTimer,
  MdStorage
} from "react-icons/md";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

const DashboardOverview = () => {
  const [health, setHealth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintMsg, setMaintMsg] = useState("");
  const [maintLoading, setMaintLoading] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(false);
  const [aiType, setAiType] = useState("iframe");
  const [aiValue, setAiValue] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const healthRes = await fetchDataFromApi("/api/system/health");
    const analyticsRes = await fetchDataFromApi("/api/system/analytics");
    const configRes = await fetchDataFromApi("/api/system/config");

    if (!healthRes.error) setHealth(healthRes.health);
    if (!analyticsRes.error) setAnalytics(analyticsRes.analytics);
    if (!configRes.error && configRes.config) {
      setIsMaintenance(configRes.config.isMaintenanceMode);
      setMaintMsg(configRes.config.maintenanceMessage || "");
      setIsAiEnabled(configRes.config.isAiSupportEnabled || false);
      setAiType(configRes.config.aiSupportType || "iframe");
      setAiValue(configRes.config.aiSupportValue || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll stats every 30 seconds
    const interval = setInterval(() => {
      fetchDataFromApi("/api/system/health").then(res => {
        if (!res.error) setHealth(res.health);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleMaintenanceToggle = async () => {
    const confirmation = window.confirm(
      `Are you sure you want to ${isMaintenance ? "DEACTIVATE" : "ACTIVATE"} maintenance mode?`
    );
    if (!confirmation) return;

    setMaintLoading(true);
    const res = await postData("/api/system/maintenance", {
      isMaintenanceMode: !isMaintenance,
      maintenanceMessage: maintMsg
    });

    if (!res.error) {
      setIsMaintenance(!isMaintenance);
      alert(res.message);
    } else {
      alert("Failed to toggle maintenance mode");
    }
    setMaintLoading(false);
  };

  const handleAiToggleAndSave = async (newVal) => {
    setAiLoading(true);
    const res = await postData("/api/system/config", {
      isAiSupportEnabled: newVal,
      aiSupportType: aiType,
      aiSupportValue: aiValue
    });
    if (!res.error) {
      setIsAiEnabled(newVal);
      alert(`AI Support status updated to: ${newVal ? "Active" : "Disabled"}`);
    } else {
      alert("Failed to update AI Support status");
    }
    setAiLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-500"></div>
      </div>
    );
  }

  // Format uptime to readable string
  const formatUptime = (seconds) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 leading-none mb-1.5">Health & Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time system diagnostics and performance metrics.</p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      {/* Primary Analytics Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">&#x20b9;{analytics.totalRevenue.toLocaleString("en-IN")}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <MdOutlineAttachMoney size={24} />
            </div>
          </div>

          <div className="glass-panel glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{analytics.totalOrders}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <MdOutlineShoppingCart size={24} />
            </div>
          </div>

          <div className="glass-panel glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Users (24h)</span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{analytics.activeUsers24h}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <MdPeople size={24} />
            </div>
          </div>

          <div className="glass-panel glow-card p-5 rounded-2xl flex items-center justify-between transition-all duration-300">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Registered Sellers</span>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{analytics.totalSellers}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <MdStore size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Health & Diagnostic Metrics */}
      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-slate-200">System Health Diagnostics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div className="bg-slate-900/40 p-4 border border-slate-800/40 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <MdOutlineTimer size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Uptime</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{formatUptime(health.uptime)}</h4>
              </div>

              <div className="bg-slate-900/40 p-4 border border-slate-800/40 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <MdOutlineComputer size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Platform</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase">{health.platform}</h4>
              </div>

              <div className="bg-slate-900/40 p-4 border border-slate-800/40 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <MdStorage size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Database</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${health.dbStatus === "Connected" ? "bg-green-500" : "bg-red-500"}`}></div>
                  <h4 className="text-xs font-bold text-slate-200">{health.dbStatus}</h4>
                </div>
              </div>

              <div className="bg-slate-900/40 p-4 border border-slate-800/40 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <MdOutlineSettingsInputAntenna size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Active Sessions</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200">{health.activeSessions}</h4>
              </div>
            </div>

            {/* RAM Progress Bars */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>OS Memory (RAM) Usage</span>
                  <span>{health.memory.used} MB / {health.memory.total} MB ({Math.round((health.memory.used / health.memory.total) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((health.memory.used / health.memory.total) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Node Process Heap Allocation</span>
                  <span>{health.memory.processUsed} MB / {health.memory.total} MB</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((health.memory.processUsed / health.memory.total) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Mode Controller */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200 mb-1">Maintenance Controller</h2>
              <p className="text-[10px] text-slate-400 mb-4">Toggle global system maintenance lock status.</p>

              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between bg-slate-900/40 p-3.5 border border-slate-800/40 rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Maintenance Status</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{isMaintenance ? "Currently BLOCKED" : "Live & Operational"}</p>
                  </div>
                  <button
                    onClick={handleMaintenanceToggle}
                    disabled={maintLoading}
                    className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-all duration-300 ${
                      isMaintenance ? "bg-red-500" : "bg-slate-700"
                    }`}
                  >
                    <div
                      className={`bg-white w-4.5 h-4.5 rounded-full transition-all duration-300 ${
                        isMaintenance ? "translate-x-5.5" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase text-slate-400 ml-1">Custom Message</span>
                  <textarea
                    rows={3}
                    className="w-full p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-violet-500/80 transition-all duration-300"
                    placeholder="Provide a reason for maintenance..."
                    value={maintMsg}
                    onChange={(e) => setMaintMsg(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                setMaintLoading(true);
                const res = await postData("/api/system/maintenance", {
                  isMaintenanceMode: isMaintenance,
                  maintenanceMessage: maintMsg
                });
                if (!res.error) alert("Message updated successfully!");
                setMaintLoading(false);
              }}
              disabled={maintLoading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 rounded-xl text-xs font-semibold mt-4 transition-all cursor-pointer"
            >
              Update Message
            </button>
          </div>
        </div>
      )}

      {/* AI Support Chatbot Controller */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/40 flex flex-col gap-5">
        <div>
          <h2 className="text-sm font-bold text-slate-200 mb-1">AI Support Agent Settings</h2>
          <p className="text-[10px] text-slate-400">Configure your automated custom AI agent to chat with customers on the public store.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-4">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between bg-slate-900/40 p-4 border border-slate-800/40 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-slate-200">AI Assistant Status</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{isAiEnabled ? "Active & Visible" : "Hidden from site"}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAiToggleAndSave(!isAiEnabled)}
                disabled={aiLoading}
                className={`w-12 h-6.5 rounded-full p-1 cursor-pointer transition-all duration-300 ${
                  isAiEnabled ? "bg-violet-650" : "bg-slate-700"
                }`}
              >
                <div
                  className={`bg-white w-4.5 h-4.5 rounded-full transition-all duration-300 ${
                    isAiEnabled ? "translate-x-5.5" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            {/* Type Selector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase text-slate-400 ml-1">Integration Method</span>
              <select
                className="admin-select w-full"
                value={aiType}
                onChange={(e) => setAiType(e.target.value)}
              >
                <option value="iframe">Iframe Embed Link</option>
                <option value="script">JavaScript Widget Code</option>
              </select>
            </div>
          </div>

          {/* Value input (spans 2 columns) */}
          <div className="md:col-span-2 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-[10px] font-semibold uppercase text-slate-400 ml-1">
                {aiType === "iframe" ? "Iframe Share URL" : "JS script widget snippet"}
              </span>
              <textarea
                rows={4}
                className="w-full p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-violet-500/80 transition-all duration-300"
                placeholder={
                  aiType === "iframe"
                    ? "e.g. https://interfaces.zapier.com/embed/page/..."
                    : "e.g. <script src='https://embed.tawk.to/...'></script>"
                }
                value={aiValue}
                onChange={(e) => setAiValue(e.target.value)}
              />
            </div>

            <button
              onClick={async () => {
                setAiLoading(true);
                const res = await postData("/api/system/config", {
                  isAiSupportEnabled: isAiEnabled,
                  aiSupportType: aiType,
                  aiSupportValue: aiValue
                });
                if (!res.error) alert("AI settings updated successfully!");
                else alert(res.message || "Failed to update AI settings");
                setAiLoading(false);
              }}
              disabled={aiLoading}
              className="px-5 py-2.5 bg-violet-650 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all cursor-pointer w-fit ml-auto"
            >
              {aiLoading ? "Saving..." : "Save AI Configuration"}
            </button>
          </div>
        </div>
      </div>

      {/* Revenue & Growth Area Charts */}
      {analytics?.salesGraphData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
            <h2 className="text-sm font-bold text-slate-200 mb-6">Revenue & Orders growth</h2>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.salesGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#11131c", borderColor: "#1e293b" }} labelStyle={{ color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Categories Distribution */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-sm font-bold text-slate-200">Top Selling Categories</h2>
            <div className="flex flex-col gap-4 justify-center h-full">
              {analytics.topCategories?.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="font-medium text-slate-300">{item._id || "Uncategorized"}</span>
                    <span>{item.sales} Sales</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-violet-500" : idx === 1 ? "bg-indigo-400" : idx === 2 ? "bg-blue-400" : "bg-amber-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.round((item.sales / (analytics.topCategories[0]?.sales || 1)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {analytics.topCategories?.length === 0 && (
                <span className="text-xs text-slate-500 text-center py-10">No sales record found</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
