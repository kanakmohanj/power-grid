import React, { useState, useEffect } from "react";

import axiosInstance from "../../api/axiosInstance";
import ComplaintForm from "./ComplaintForm";
import ComplaintLifecycle from "./ComplaintLifecycle";
import StatCard from "../../components/StatCard";
import { useNavigate } from "react-router-dom";
export default function CitizenDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [editComplaint, setEditComplaint] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const res = await axiosInstance.get("/api/dashboard/citizen");
        setUsername(res.data.msg.replace("Welcome citizen ", ""));
        const statsRes = await axiosInstance.get("/api/users/dashboard/stats");
        setStats(statsRes.data);
        setLoading(false);
      } catch {
        navigate("/login");
      }
    };

    verifyUser();
  }, [navigate]);

  if (loading)
    return (
      <p className="text-center text-[#7CFFD8] mt-20 text-lg font-semibold">
        Checking authorization...
      </p>
    );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen text-white font-inter relative overflow-hidden pt-20">

      <div className="absolute inset-0 bg-[#020b1c]" />

      <div className="absolute inset-0 opacity-[0.2] bg-[url('./assets/grid.webp')] bg-contain pointer-events-none mix-blend-overlay"></div>

      <div className="absolute w-[500px] h-[500px] bg-blue-600 blur-[150px] opacity-20 top-[-140px] left-[-120px]" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-400 blur-[150px] opacity-20 bottom-[-100px] right-[-100px]" />

      {/* SIDEBAR */}
      <aside className="w-full lg:w-64 z-20 bg-[#020b1c]/80 backdrop-blur-xl
        border-b lg:border-b-0 lg:border-r border-cyan-500/30 p-6 rounded-b-2xl lg:rounded-b-none lg:rounded-r-2xl
        shadow-[0_5px_30px_rgba(0,243,255,0.1)] lg:shadow-[5px_0_30px_rgba(0,243,255,0.1)]">

        <h2 className="font-orbitron text-2xl font-bold text-cyan-400 tracking-wide mt-4 lg:mt-13 mb-6 lg:mb-10 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          Dashboard
        </h2>

        <div className="flex lg:block space-x-4 lg:space-x-0 lg:space-y-5 overflow-x-auto pb-2 lg:pb-0">

          {/* My Complaints */}
          <button
            className={`w-auto lg:w-full px-5 py-3 text-left rounded-lg transition font-semibold tracking-wide whitespace-nowrap
              ${activeMenu === "lifecycle"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
              }`}
            onClick={() => setActiveMenu("lifecycle")}
          >
            My Complaints
          </button>

          {/* Submit Complaint */}
          <button
            className={`w-auto lg:w-full px-5 py-3 text-left rounded-lg transition font-semibold tracking-wide whitespace-nowrap
              ${activeMenu === "complaint-form"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
              }`}
            onClick={() => setActiveMenu("complaint-form")}
          >
            Submit Complaint
          </button>

        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-10 z-20">

        {/* Submit Complaint Panel */}
        {activeMenu === "complaint-form" && (
          <div className="glass-panel p-8 mt-10 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,243,255,0.1)] rounded-xl" >
            <ComplaintForm neon />
          </div>
        )}

        {activeMenu === "lifecycle" && (
          <div
            className="glass-panel p-8 mt-10 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,243,255,0.1)] rounded-2xl"
          >

            <h2 className="font-orbitron text-3xl text-cyan-400 mb-4 drop-shadow-md">
              Welcome, {username}! ⚡
            </h2>
            {stats && (
              <div
                className="bg-cyan-900/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 mb-12 shadow-inner"
              >
                {/* SECTION TITLE */}
                <div className="mb-6">
                  <h3 className="font-orbitron text-xl text-cyan-300 tracking-wide">
                    Complaint Analytics
                  </h3>
                  <div className="h-[2px] w-40 bg-gradient-to-r from-cyan-400 to-transparent mt-2" />
                </div>

                {/* ANALYTICS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 ">
                  <StatCard
                    label="Total Complaints"
                    value={stats.total}
                    color="#00f3ff"
                  />

                  <StatCard
                    label="Open"
                    value={stats.open}
                    color="#FFD93C"
                  />

                  <StatCard
                    label="In Progress"
                    value={stats.inprogress}
                    color="#00CFFF"
                  />

                  <StatCard
                    label="Resolved"
                    value={stats.resolved}
                    color="#4CAF50"
                  />

                  <StatCard
                    label="Last Status"
                    value={stats.lastComplaintStatus || "N/A"}
                    color="#FFAA33"
                  />
                </div>
              </div>
            )}


            <ComplaintLifecycle />
          </div>
        )}

      </main>
    </div>
  );
}
