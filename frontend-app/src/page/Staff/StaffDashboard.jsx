import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import StatCard from "../../components/StatCard";
import CommentSection from "../Citizen/CommentSection"; // ✅ SAME AS CITIZEN

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filters, setFilters] = useState({ status: "All", priority: "All" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [stats, setStats] = useState(null);
  const [timeLefts, setTimeLefts] = useState({});
  const [userna, setUserna] = useState("");
  const [ratearr, setRatearr] = useState([]);
  const [rating, setRating] = useState(0);

  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");

  // ✅ COMMENT TOGGLE STATE
  const [openComments, setOpenComments] = useState({});

  const toggleComments = (id) => {
    setOpenComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleComplaint = (id) => {
    setSelectedComplaints((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await axiosInstance.get("/api/complaints");
        const complaintsData = Array.isArray(res.data) ? res.data : [];
        setComplaints(complaintsData);

        if (complaintsData.length === 0) {
          setUserna("Engineer");
          setRatearr([]);
        } else {
          const assigned = complaintsData.find(c => c?.assigned_to?.username);
          setUserna(assigned?.assigned_to?.username || "Engineer");
          setRatearr(assigned?.assigned_to?.ratings || []);
        }

        const statsRes = await axiosInstance.get("/api/users/stats");
        setStats(statsRes.data);

        const initialTimes = {};
        complaintsData.forEach(c => {
          initialTimes[c._id] = calculateTimeLeft(c.deadline);
        });
        setTimeLefts(initialTimes);

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch complaints");
      }
    };

    fetchComplaints();
  }, []);

  useEffect(() => {
    if (!ratearr.length) {
      setRating(0);
      return;
    }
    const sum = ratearr.reduce((acc, r) => acc + (r.rating || 0), 0);
    setRating(sum / ratearr.length);
  }, [ratearr]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const newTimes = {};
      complaints.forEach((c) => {
        newTimes[c._id] = calculateTimeLeft(c.deadline);
      });
      setTimeLefts(newTimes);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [complaints]);

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      setUpdating(complaintId);
      await axiosInstance.patch("/api/complaints/status", {
        complaintId,
        status: newStatus,
      });
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === complaintId ? { ...c, status: newStatus } : c
        )
      );
      setUpdating(null);
    } catch {
      alert("Failed to update status.");
      setUpdating(null);
    }
  };

  const filteredComplaints = complaints
    .filter(
      (c) =>
        (filters.status === "All" || c.status === filters.status) &&
        (filters.priority === "All" || c.priority === filters.priority) &&
        c.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "latest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "priority") {
        const order = { High: 3, Medium: 2, Low: 1 };
        return order[b.priority] - order[a.priority];
      }
      return 0;
    });

  if (loading) {
    return (
      <p className="text-center mt-20 text-cyan-400 font-semibold text-lg">
        Loading complaints...
      </p>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#020b1c] text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.2] bg-[url('./assets/grid.webp')] bg-contain pointer-events-none mix-blend-overlay"></div>
      <div className="absolute w-[500px] h-[500px] bg-blue-600 blur-[150px] opacity-20 top-[-100px] left-[-100px]"></div>
      <div className="absolute w-[500px] h-[500px] bg-cyan-400 blur-[150px] opacity-20 bottom-[-100px] right-[-100px]"></div>

      <div className="min-h-screen w-full relative z-10 p-6 pt-24 lg:pt-28">

        {/* HEADER */}
        <div className="w-full h-20 bg-[#020b1c]/80 backdrop-blur-xl flex items-center justify-center px-6 border-b border-cyan-500/30 mt-14 shadow-[0_0_15px_rgba(0,243,255,0.2)] rounded-xl">
          <h1 className="text-3xl font-orbitron font-bold text-cyan-400 drop-shadow-md">
            Engineer Dashboard
          </h1>
        </div>

        {/* WELCOME + RATING */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-orbitron font-bold text-cyan-400">
            Welcome {userna}
          </h2>

          <div className="flex items-center text-2xl">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={
                  i <= Math.round(rating)
                    ? "text-cyan-400 drop-shadow-md scale-110"
                    : "text-gray-500"
                }
              >
                ★
              </span>
            ))}
            <span className="ml-3 text-cyan-400 text-xl font-semibold">
              {rating.toFixed(1)} / 5
            </span>
          </div>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard label="Total Assigned" value={stats.total} color="#4db8ff" />
            <StatCard label="Open" value={stats.open} color="#FFD93C" />
            <StatCard label="In Progress" value={stats.inProgress} color="#00f3ff" />
            <StatCard label="Resolved" value={stats.resolved} color="#4CAF50" />
            <StatCard label="Closed" value={stats.closed} color="#9CA3AF" />
            <StatCard label="SLA Breaches" value={stats.slaViolations} color="#FF4444" />
          </div>
        )}

        {/* FILTER BAR */}
        <div className="flex flex-wrap gap-4 mb-6 bg-cyan-900/10 p-4 rounded-xl border border-cyan-500/30 backdrop-blur-md">
          <input
            type="text"
            placeholder="Search by title..."
            className="flex-1 px-4 py-2 rounded-lg bg-black/40 border border-cyan-400/40 text-[#72b1e7]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 rounded-lg text-white border border-cyan-600/40"
          >
            {["All", "OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
              <option key={s} className="bg-black">{s}</option>
            ))}
          </select>

          <select value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-4 py-2 rounded-lg text-white border border-cyan-600/40"
          >
            {["All", "Low", "Medium", "High"].map((p) => (
              <option key={p} className="bg-black">{p}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg text-white border border-cyan-600/40"
          >
            <option value="latest" className="bg-black">Latest</option>
            <option value="oldest" className="bg-black">Oldest</option>
            <option value="priority" className="bg-black">Priority</option>
          </select>
        </div>

        {/* COMPLAINT CARDS */}
        <div className="flex flex-col gap-5">
          {filteredComplaints.map((c) => {
            const timeLeft = timeLefts[c._id];

            return (
              <div
                key={c._id}
                className="glass-panel p-5 transition-all border border-cyan-500/30 shadow-[0_0_15px_rgba(0,243,255,0.05)] hover:shadow-[0_0_25px_rgba(0,243,255,0.15)] rounded-xl"
              >
                {/* TITLE + COMMENT BUTTON */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedComplaints.includes(c._id)}
                      onChange={() => toggleComplaint(c._id)}
                      className="accent-[#5779ff] scale-125"
                    />
                    <h3 className="text-xl font-semibold text-cyan-400">
                      {c.title} <span className="text-cyan-300">({c.status})</span>
                    </h3>
                  </div>

                  {/* 💬 COMMENT BUTTON */}
                  <button
                    onClick={() => toggleComments(c._id)}
                    className="px-3 py-1 rounded-lg border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/20 transition"
                  >
                    💬
                  </button>
                </div>

                <p className="mt-1 text-[#D9FFE8]">{c.description}</p>


                <p className="text-sm mt-2 text-cyan-200">
                  <strong>Category:</strong> {c.category} |{" "}
                  <strong>Priority:</strong> {c.priority}
                </p>

                {timeLeft && (
                  <p className={`mt-2 font-semibold ${timeLeft.total <= 0 ? "text-red-500" : "text-yellow-400"}`}>
                    Deadline:{" "}
                    {timeLeft.total > 0
                      ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
                      : "Deadline passed"}
                  </p>
                )}
                {c.photo_url && (
                  <img
                    src={c.photo_url}
                    alt="Complaint upload"
                    className="
      mt-4
      w-full
      max-h-80
      object-contain
      rounded-lg
      border border-cyan-400/40
      bg-black/40
    "
                  />
                )}


                {/* UPDATE STATUS */}
                <div className="mt-4">
                  <label className="mr-2 text-[#4a8ae4]">Update Status:</label>
                  <select
                    value={c.status}
                    disabled={updating === c._id}
                    onChange={(e) => handleStatusChange(c._id, e.target.value)}
                    className="px-3 py-2 rounded-lg bg-cyan-500/30 text-white border"
                  >
                    {["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                      <option key={s} className="bg-black">{s}</option>
                    ))}
                  </select>

                  {updating === c._id && (
                    <span className="ml-3 text-cyan-400 animate-pulse">Updating...</span>
                  )}
                </div>


                {/* COMMENTS */}
                {openComments[c._id] && (
                  <div className="mt-4 border-t border-cyan-500/20 pt-3">
                    <CommentSection complaintId={c._id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// SLA TIMER
function calculateTimeLeft(deadline) {
  if (!deadline) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const diff = new Date(deadline).getTime() - Date.now();
  return {
    total: diff,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
