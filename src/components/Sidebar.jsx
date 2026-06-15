import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdOutlineDashboard,
  MdPeopleOutline,
  MdOutlineStorefront,
  MdOutlineCategory,
  MdOutlineBook,
  MdOutlineReceiptLong,
  MdOutlineHistory,
  MdOutlineExitToApp,
  MdOutlineChevronLeft,
  MdOutlineChevronRight,
  MdOutlineViewCarousel
} from "react-icons/md";

const menuItems = [
  { name: "Health & Dashboard", path: "/", icon: MdOutlineDashboard },
  { name: "Platform Financials", path: "/financials", icon: MdOutlineReceiptLong },
  { name: "User Management", path: "/users", icon: MdPeopleOutline },
  { name: "Seller Approvals", path: "/sellers", icon: MdOutlineStorefront },
  { name: "Category Tree", path: "/categories", icon: MdOutlineCategory },
  { name: "Blogs & CMS", path: "/blogs", icon: MdOutlineBook },
  { name: "Banners & Slides", path: "/banners", icon: MdOutlineViewCarousel },
  { name: "Live Logs Monitor", path: "/logs", icon: MdOutlineHistory },
  { name: "Admin Audit Logs", path: "/audit-logs", icon: MdOutlineHistory }
];

const Sidebar = ({ onLogout, user }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="h-screen bg-[#0d0f1a] border-r border-slate-800/60 flex flex-col justify-between shrink-0 transition-all duration-300 relative"
      style={{ width: collapsed ? "72px" : "248px" }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3.5 top-20 w-7 h-7 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer z-10 hover:bg-slate-700 transition-all shadow-lg"
      >
        {collapsed ? <MdOutlineChevronRight size={16} /> : <MdOutlineChevronLeft size={16} />}
      </button>

      <div className="flex flex-col gap-6 overflow-hidden pt-5">
        {/* Header/Logo */}
        <div className={`flex items-center gap-3 px-4 pb-2 border-b border-slate-800/40 ${collapsed ? "justify-center px-2" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-violet-500/25 shrink-0">
            S
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-slate-100 text-sm tracking-wide uppercase leading-none whitespace-nowrap">
                System Admin
              </h2>
              <span className="text-[9px] text-violet-400 font-semibold tracking-widest uppercase whitespace-nowrap">
                Pooja Trend Hub
              </span>
            </div>
          )}
        </div>

        {/* Menu List */}
        <nav className={`flex flex-col gap-1 ${collapsed ? "px-2" : "px-3"}`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.name : ""}
                className={`flex items-center gap-3 rounded-xl transition-all duration-200 border ${
                  collapsed ? "px-0 py-3 justify-center" : "px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-violet-600/15 text-violet-400 border-violet-500/30 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border-transparent"
                }`}
              >
                <Icon size={19} className="shrink-0" />
                {!collapsed && <span className="text-[13px] font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Info + Logout */}
      <div className={`border-t border-slate-800/40 ${collapsed ? "p-2" : "p-3"} flex flex-col gap-2`}>
        {/* User chip */}
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/30 rounded-xl border border-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          title={collapsed ? "Log out" : ""}
          className={`flex items-center gap-3 rounded-xl text-red-400/75 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200 cursor-pointer ${
            collapsed ? "justify-center py-3 px-0" : "px-3.5 py-2.5"
          }`}
        >
          <MdOutlineExitToApp size={19} className="shrink-0" />
          {!collapsed && <span className="text-[13px] font-medium">Log out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
