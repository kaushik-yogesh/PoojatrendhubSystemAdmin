import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import DashboardOverview from "./pages/DashboardOverview";
import UserManager from "./pages/UserManager";
import SellerManager from "./pages/SellerManager";
import CategoryManager from "./pages/CategoryManager";
import BlogManager from "./pages/BlogManager";
import BannerManager from "./pages/BannerManager";
import LogsMonitor from "./pages/LogsMonitor";
import AuditLogs from "./pages/AuditLogs";
import "./index.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("adminUser");
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("adminUser");
        localStorage.removeItem("accessToken");
      }
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("adminUser", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminUser");
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#090a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center font-bold text-white text-xl shadow-xl shadow-violet-500/30 animate-pulse">
            S
          </div>
          <p className="text-xs text-slate-500 tracking-widest uppercase">Loading System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#090a0f] overflow-hidden">
        <Sidebar onLogout={handleLogout} user={user} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/users" element={<UserManager />} />
            <Route path="/sellers" element={<SellerManager />} />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/blogs" element={<BlogManager />} />
            <Route path="/banners" element={<BannerManager />} />
            <Route path="/logs" element={<LogsMonitor />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
