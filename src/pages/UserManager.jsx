import React, { useState, useEffect } from "react";
import { fetchDataFromApi, putData } from "../utils/api";
import { MdOutlineBlock, MdCheckCircle, MdOutlineHistory, MdOutlineSearch } from "react-icons/md";

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // for viewing login history
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const res = await fetchDataFromApi("/api/user/getAllUsers");
    if (!res.error && res.users) {
      setUsers(res.users);
      setFilteredUsers(res.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let result = users;

    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u._id?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(result);
  }, [search, statusFilter, users]);

  const handleStatusToggle = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "suspended" : "Active";
    const confirmation = window.confirm(
      `Are you sure you want to ${nextStatus === "suspended" ? "SUSPEND" : "ACTIVATE"} this user?`
    );
    if (!confirmation) return;

    const res = await putData("/api/user/admin-controls/update-status", {
      id,
      status: nextStatus
    });

    if (!res.error) {
      alert(res.message);
      // Local state update
      setUsers(users.map((u) => (u._id === id ? { ...u, status: nextStatus } : u)));
    } else {
      alert("Failed to update status");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    const confirmation = window.confirm(`Change this user's role to ${newRole}?`);
    if (!confirmation) return;

    const res = await putData("/api/user/admin-controls/update-role", {
      id,
      role: newRole
    });

    if (!res.error) {
      alert(res.message);
      setUsers(users.map((u) => (u._id === id ? { ...u, role: newRole } : u)));
    } else {
      alert("Failed to update role");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 leading-none mb-1.5">User Management</h1>
        <p className="text-xs text-slate-400">View user details, update system roles, and suspend/activate accounts.</p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/30 p-4 border border-slate-800/40 rounded-2xl">
        <div className="relative flex-1 max-w-[400px]">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <MdOutlineSearch size={18} />
          </span>
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500/80"
            placeholder="Search by name, email or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
          {["ALL", "Active", "Inactive", "suspended"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                statusFilter === filter
                  ? "bg-violet-600/20 text-violet-400 border border-violet-500/35"
                  : "text-slate-400 hover:text-slate-300 border border-transparent"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#11131c] text-slate-400 uppercase font-semibold border-b border-slate-800/50">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Session IP</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    Loading users list...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-800/10 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} className="w-8 h-8 rounded-full bg-slate-800 object-cover" />
                        <div>
                          <div className="font-semibold text-slate-100">{user.name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-violet-500"
                      >
                        <option value="USER">User</option>
                        <option value="SELLER">Seller</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.status === "Active"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : user.status === "suspended"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{user.lastIpAddress || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowHistoryModal(true);
                          }}
                          title="View Login History"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-all border border-slate-700/60"
                        >
                          <MdOutlineHistory size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(user._id, user.status)}
                          title={user.status === "Active" ? "Suspend User" : "Activate User"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${
                            user.status === "Active"
                              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                              : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
                          }`}
                        >
                          {user.status === "Active" ? <MdOutlineBlock size={16} /> : <MdCheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] bg-[#11131c] border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-100 text-base">{selectedUser.name}'s Logins</h3>
                <span className="text-[10px] text-slate-400 font-medium">Tracking history for last 10 sessions</span>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedUser(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 ? (
                selectedUser.loginHistory.map((log, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-3 border border-slate-850 rounded-xl flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>{new Date(log.date).toLocaleString()}</span>
                      <span className="font-mono text-slate-400">{log.ip}</span>
                    </div>
                    <span className="text-xs text-slate-300 font-semibold truncate leading-none mt-1">{log.browser}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500 text-center py-6">No session log records found.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
