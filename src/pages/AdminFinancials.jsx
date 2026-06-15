import React, { useEffect, useState } from "react";
import { fetchDataFromApi } from "../utils/api";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
} from "recharts";
import { FiDollarSign, FiActivity, FiShield, FiTrendingUp } from "react-icons/fi";
import { CircularProgress } from "@mui/material";

const RANGE_OPTIONS = [
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
  { label: "Last 90 Days", value: 90 },
];

const KPICard = ({ label, value, icon, color }) => (
  <div className="bg-[#151828] rounded-xl shadow-lg border border-slate-800/50 p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-slate-700/80 transition-all">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-30`} style={{ background: color }}></div>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl z-10`} style={{ background: color }}>
      {icon}
    </div>
    <div className="z-10">
      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
    </div>
  </div>
);

export default function AdminFinancials() {
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchDataFromApi(`/api/analytics/admin?days=${range}`).then((res) => {
      if (res?.success) setData(res);
      setLoading(false);
    });
  }, [range]);

  return (
    <div className="w-full h-full text-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Platform Financials</h1>
          <p className="text-sm text-slate-400 mt-1">Marketplace revenue, GST, and Escrow overview</p>
        </div>
        <div className="flex gap-2 bg-[#151828] p-1 rounded-xl border border-slate-800/50">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                range === opt.value
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                  : "bg-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <CircularProgress sx={{ color: '#8b5cf6' }} />
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <KPICard
              icon={<FiTrendingUp />}
              label="Gross Marketplace Value (GMV)"
              value={`₹${(data?.summary?.grossMarketplaceValue || 0).toLocaleString("en-IN")}`}
              color="linear-gradient(135deg, #3b82f6, #2dd4bf)"
            />
            <KPICard
              icon={<FiDollarSign />}
              label="Platform Fee Revenue"
              value={`₹${(data?.summary?.totalPlatformRevenue || 0).toLocaleString("en-IN")}`}
              color="linear-gradient(135deg, #8b5cf6, #d946ef)"
            />
            <KPICard
              icon={<FiShield />}
              label="Tax Liability (GST + TCS/TDS)"
              value={`₹${(data?.summary?.totalTaxLiability || 0).toLocaleString("en-IN")}`}
              color="linear-gradient(135deg, #f59e0b, #ef4444)"
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-[#151828] rounded-xl border border-slate-800/50 p-6 shadow-lg">
            <h2 className="text-lg font-bold text-slate-100 mb-6">Financial Growth (₹)</h2>
            {data?.chartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="taxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(v) => [`₹${v.toLocaleString("en-IN")}`]} 
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#cbd5e1' }}/>
                  
                  <Area type="monotone" name="GMV" dataKey="grossMarketplaceValue" stroke="#3b82f6" strokeWidth={2} fill="url(#gmvGrad)" />
                  <Area type="monotone" name="Platform Revenue" dataKey="totalPlatformRevenue" stroke="#8b5cf6" strokeWidth={3} fill="url(#revenueGrad)" />
                  <Area type="monotone" name="Tax Liability" dataKey="totalTaxLiability" stroke="#ef4444" strokeWidth={2} fill="url(#taxGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">No financial data available for this period.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
