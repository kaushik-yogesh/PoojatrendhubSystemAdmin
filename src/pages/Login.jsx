import React, { useState } from "react";
import { postData, fetchDataFromApi } from "../utils/api";
import { MdOutlineEmail, MdOutlineLock } from "react-icons/md";
import ForgotPassword from "./ForgotPassword";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await postData("/api/user/login", { email, password });
      
      if (res?.error) {
        setError(res.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      const token = res.data?.accessToken;
      if (!token) {
        setError("Token generation failed");
        setLoading(false);
        return;
      }

      // Save token temporarily to fetch user-details
      localStorage.setItem("accessToken", token);

      // Verify if role is ADMIN
      const userDetails = await fetchDataFromApi("/api/user/user-details");
      
      if (userDetails?.error || userDetails?.data?.role !== "ADMIN") {
        setError("Forbidden: You are not authorized as a System Administrator.");
        localStorage.removeItem("accessToken");
        setLoading(false);
        return;
      }

      // Success
      localStorage.setItem("refreshToken", res.data.refreshToken);
      onLoginSuccess(userDetails.data);
    } catch (err) {
      setError("Server connection failure");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#090a0f] p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] -top-10 -left-10 pulse-glow"></div>
      <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -bottom-10 -right-10 pulse-glow" style={{ animationDelay: "1s" }}></div>

      <div className="w-full max-w-[450px] glass-panel rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-violet-500/20 mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1 leading-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400">Pooja Trend Hub - System Administration</p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">Email address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <MdOutlineEmail size={18} />
              </span>
              <input
                type="email"
                required
                className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 placeholder-slate-600"
                placeholder="admin@poojatrendhub.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <MdOutlineLock size={18} />
              </span>
              <input
                type="password"
                required
                className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 placeholder-slate-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => setShowForgot(true)}
            className="text-xs text-slate-500 hover:text-violet-400 text-center transition-colors bg-transparent border-none cursor-pointer mt-1"
          >
            Forgot Password?
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
