import React, { useState, useEffect } from "react";
import { fetchDataFromApi, putData } from "../utils/api";
import { MdOutlineCheck, MdOutlineClose, MdOutlineStore, MdOutlineDescription } from "react-icons/md";

const SellerManager = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING"); // PENDING, APPROVED, ALL

  const loadSellers = async () => {
    setLoading(true);
    const res = await fetchDataFromApi("/api/user/admin-controls/sellers");
    if (!res.error && res.sellers) {
      setSellers(res.sellers);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleApproval = async (id, action) => {
    const confirmation = window.confirm(`Are you sure you want to set this seller to ${action}?`);
    if (!confirmation) return;

    const res = await putData("/api/user/admin-controls/approve-seller", {
      id,
      action
    });

    if (!res.error) {
      alert(res.message);
      // Reload sellers list
      loadSellers();
    } else {
      alert("Failed to process approval");
    }
  };

  const getFilteredSellers = () => {
    if (filter === "PENDING") {
      return sellers.filter((s) => s.sellerStatus === "PENDING");
    }
    if (filter === "APPROVED") {
      return sellers.filter((s) => s.sellerStatus === "APPROVED");
    }
    return sellers;
  };

  const filteredList = getFilteredSellers();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 leading-none mb-1.5">Seller Approvals</h1>
        <p className="text-xs text-slate-400">Review business profiles, verify GST registrations, and onboard platform merchants.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/30 p-2.5 border border-slate-800/40 rounded-2xl w-fit">
        {[
          { key: "PENDING", name: "Pending Approvals" },
          { key: "APPROVED", name: "Active Sellers" },
          { key: "ALL", name: "All Records" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filter === tab.key
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/35 shadow-md shadow-violet-500/5"
                : "text-slate-400 hover:text-slate-300 border border-transparent"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          <div className="text-center py-12 text-slate-500 glass-panel rounded-2xl">
            Loading seller applications...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 glass-panel rounded-2xl">
            No seller applications found in this section.
          </div>
        ) : (
          filteredList.map((seller) => (
            <div
              key={seller._id}
              className="glass-panel p-6 rounded-2xl border border-slate-800/60 flex flex-col md:flex-row justify-between gap-6"
            >
              {/* User Profile Info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 mt-1">
                  <MdOutlineStore size={26} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-100">{seller.businessDetails?.businessName || seller.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        seller.sellerStatus === "APPROVED"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : seller.sellerStatus === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {seller.sellerStatus}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Applicant: {seller.name} ({seller.email})</span>
                  {seller.mobile && <span className="text-xs text-slate-400">Phone: {seller.mobile}</span>}
                </div>
              </div>

              {/* Business Registration Details */}
              <div className="bg-slate-950/40 p-4 border border-slate-900/60 rounded-xl md:w-[45%] flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MdOutlineDescription size={16} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Business Verification Info</span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">GST Number:</span>
                    <span className="font-mono text-slate-300 font-semibold">{seller.businessDetails?.gstNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Business Name:</span>
                    <span className="text-slate-300">{seller.businessDetails?.businessName || "N/A"}</span>
                  </div>
                  <div className="flex flex-col mt-1">
                    <span className="text-slate-500">Business Address:</span>
                    <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">{seller.businessDetails?.businessAddress || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col justify-end gap-3 shrink-0 self-center">
                {seller.sellerStatus === "PENDING" ? (
                  <>
                    <button
                      onClick={() => handleApproval(seller._id, "APPROVED")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-green-500/10 active:scale-[0.98] cursor-pointer"
                    >
                      <MdOutlineCheck size={16} />
                      Approve Seller
                    </button>
                    <button
                      onClick={() => handleApproval(seller._id, "REJECTED")}
                      className="px-4 py-2 bg-red-500/15 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MdOutlineClose size={16} />
                      Reject Application
                    </button>
                  </>
                ) : seller.sellerStatus === "APPROVED" ? (
                  <button
                    onClick={() => handleApproval(seller._id, "REJECTED")}
                    className="px-4 py-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 border border-slate-700/60 hover:border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MdOutlineClose size={16} />
                    Revoke Seller Role
                  </button>
                ) : (
                  <button
                    onClick={() => handleApproval(seller._id, "APPROVED")}
                    className="px-4 py-2 bg-slate-800 hover:bg-green-500/10 hover:text-green-400 border border-slate-700/60 hover:border-green-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MdOutlineCheck size={16} />
                    Re-Approve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerManager;
