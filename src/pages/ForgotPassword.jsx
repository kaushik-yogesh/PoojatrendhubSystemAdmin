import React, { useState, useEffect } from "react";
import { postData } from "../utils/api";
import { MdOutlineEmail, MdOutlineLock, MdSecurity } from "react-icons/md";

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3 };

const ForgotPassword = ({ onBack }) => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const clearMessages = () => { setError(""); setSuccess(""); };

  // Step 1 — Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!email) return setError("Please enter your email address");
    setLoading(true);
    try {
      const res = await postData("/api/user/forgot-password", { email });
      if (!res?.error) {
        setSuccess("OTP sent to " + email);
        localStorage.setItem("admin_resetEmail", email);
        setCountdown(60);
        setStep(STEPS.OTP);
      } else {
        setError(res?.message || "Failed to send OTP");
      }
    } catch {
      setError("Server connection failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    clearMessages();
    setLoading(true);
    try {
      const res = await postData("/api/user/forgot-password", { email });
      if (!res?.error) { setSuccess("OTP resent!"); setCountdown(60); }
      else setError(res?.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    if (otp.length !== 6) return setError("Enter the 6-digit OTP");
    setLoading(true);
    try {
      const res = await postData("/api/user/verify-forgot-password-otp", {
        email: localStorage.getItem("admin_resetEmail"),
        otp,
      });
      if (!res?.error) {
        setSuccess("OTP verified! Set your new password.");
        setStep(STEPS.RESET);
      } else {
        setError(res?.message || "Invalid or expired OTP");
      }
    } catch {
      setError("Server connection failure.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset Password
  const handleReset = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");
    setLoading(true);
    try {
      const res = await postData("/api/user/reset-password", {
        email: localStorage.getItem("admin_resetEmail"),
        newPassword,
        confirmPassword,
      });
      if (!res?.error) {
        setSuccess("Password reset successfully! Redirecting to login...");
        localStorage.removeItem("admin_resetEmail");
        setTimeout(() => onBack(), 1500);
      } else {
        setError(res?.message || "Failed to reset password");
      }
    } catch {
      setError("Server connection failure.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Email", "Verify OTP", "New Password"];

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#090a0f] p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] -top-10 -left-10 pulse-glow" />
      <div className="absolute w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -bottom-10 -right-10 pulse-glow" style={{ animationDelay: "1s" }} />

      <div className="w-full max-w-[450px] glass-panel rounded-3xl p-8 shadow-2xl relative z-10">

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const active = s === step;
            const done = s < step;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${done ? "bg-green-500 text-white" : active ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    {done ? "✓" : s}
                  </div>
                  <span className={`text-[9px] tracking-wider uppercase ${active ? "text-violet-400" : "text-slate-600"}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`h-[2px] w-8 mb-5 rounded transition-all duration-300 ${done ? "bg-green-500" : "bg-slate-800"}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-medium">{error}</div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-xs text-green-400 font-medium">{success}</div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === STEPS.EMAIL && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-500/20">
                <MdOutlineEmail size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">Forgot Password?</h1>
              <p className="text-xs text-slate-400 mt-1">Enter admin email to receive OTP</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MdOutlineEmail size={18} />
                </span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 placeholder-slate-600"
                  placeholder="admin@poojatrendhub.com" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50">
              {loading ? "Sending..." : "Send OTP →"}
            </button>
            <button type="button" onClick={onBack} className="text-xs text-slate-500 hover:text-slate-300 text-center transition-colors bg-transparent border-none cursor-pointer">
              ← Back to Login
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === STEPS.OTP && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-500/20">
                <MdSecurity size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">Enter OTP</h1>
              <p className="text-xs text-slate-400 mt-1">6-digit code sent to <span className="text-violet-400">{email}</span></p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">OTP Code</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MdSecurity size={18} />
                </span>
                <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))} maxLength={6}
                  className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 placeholder-slate-600 tracking-[0.5em] text-center"
                  placeholder="· · · · · ·" />
              </div>
            </div>
            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50">
              {loading ? "Verifying..." : "Verify OTP →"}
            </button>
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => { setStep(STEPS.EMAIL); setOtp(""); clearMessages(); }}
                className="text-slate-500 hover:text-slate-300 cursor-pointer bg-transparent border-none">← Change Email</button>
              <button type="button" onClick={handleResend} disabled={countdown > 0}
                className={`cursor-pointer bg-transparent border-none ${countdown > 0 ? "text-slate-600" : "text-violet-400 hover:text-violet-300"}`}>
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === STEPS.RESET && (
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            <div className="text-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-violet-500/20">
                <MdOutlineLock size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-100">Set New Password</h1>
              <p className="text-xs text-slate-400 mt-1">Choose a strong password</p>
            </div>

            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MdOutlineLock size={18} />
                </span>
                <input type={showNew ? "text" : "password"} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 placeholder-slate-600"
                  placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
              {newPassword && (
                <p className={`text-[10px] ml-1 ${newPassword.length >= 8 ? "text-green-400" : newPassword.length >= 6 ? "text-yellow-400" : "text-red-400"}`}>
                  {newPassword.length >= 8 ? "✓ Strong" : newPassword.length >= 6 ? "⚠ Moderate" : "✗ Too short"}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase ml-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <MdOutlineLock size={18} />
                </span>
                <input type={showConfirm ? "text" : "password"} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} onPaste={(e) => e.preventDefault()}
                  className="w-full h-11 pl-10 pr-10 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-violet-500/80 focus:ring-1 focus:ring-violet-500/30 transition-all duration-300 placeholder-slate-600"
                  placeholder="Re-enter password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer">
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-violet-500/10 active:scale-[0.98] transition-all duration-300 cursor-pointer disabled:opacity-50">
              {loading ? "Resetting..." : "Reset Password ✓"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
