import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/StatCard";
import CreateUserForm from "../../components/CreateUserForm";
import BulkUserUpload from "../../components/BulkUserUpload";
import AdminChatbotWidget from "../../components/AdminChatbotWidget";
import ComplaintsChart from "../../components/ComplaintChart";
import CommentSection from "../Citizen/CommentSection";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [assignData, setAssignData] = useState({ complaintId: "", staffId: "" });
  const [timeLefts, setTimeLefts] = useState({});
  const [stats, setStats] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedComplaints, setSelectedComplaints] = useState([])
  const navigate = useNavigate();
  const [openComments, setOpenComments] = useState({});



  //******************* */
  const [sortBy, setSortBy] = useState("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [staffList2, setStaffList2] = useState([]);
  //******************* */
  const toggleComments = (id) => {
    setOpenComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleComplaint = (id) => {
    setSelectedComplaints((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      try {
        const dashboardRes = await axiosInstance.get("/api/dashboard/admin");
        setUsername(dashboardRes.data.msg.replace("Welcome admin ", ""));

        const complaintRes = await axiosInstance.get("/api/complaints");
        const fetchedComplaints = Array.isArray(complaintRes.data) ? complaintRes.data : [];
        setComplaints(fetchedComplaints);

        // Initialize SLA timers
        const initialTimes = {};
        fetchedComplaints.forEach((c) => {
          initialTimes[c._id] = calculateTimeLeft(c.deadline);
        });
        setTimeLefts(initialTimes);

        const staffRes = await axiosInstance.get("/api/users/staff");
        setStaffList(staffRes.data || []);
        console.log("reached")
        const processed = staffRes.data.map((staff) => {
          const ratings = staff.ratings || [];

          const averageRating =
            ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;

          const totalRatings = ratings.length;

          const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          ratings.forEach((r) => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
          });

          return { ...staff, averageRating, totalRatings, distribution };
        });

        setStaffList2(processed);

        const adminStats = await axiosInstance.get("/api/users/admin/stats");
        setStats(adminStats.data || []);
        console.log('yes')
        setLoading(false);
      } catch (err) {
        alert("Authorization failed");
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate]);

  const filteredAndSortedStaff = staffList2
    .filter((staff) =>
      (staff.username || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (staff.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.username.localeCompare(b.username);
        case "rating-high":
          return b.averageRating - a.averageRating;
        case "rating-low":
          return a.averageRating - b.averageRating;
        case "total-ratings":
          return b.totalRatings - a.totalRatings;
        default:
          return 0;
      }
    });

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        className={`text-xl ${i <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"
          }`}
      >
        ★
      </span>
    ));
  };

  const generateReport = () => {
    const reportData = staffList2.map((staff) => ({
      "Name": staff.username,
      "Email": staff.email,
      "Avg Rating": staff.averageRating.toFixed(1),
      "Total Ratings": staff.totalRatings,
      "5★": staff.distribution[5],
      "4★": staff.distribution[4],
      "3★": staff.distribution[3],
      "2★": staff.distribution[2],
      "1★": staff.distribution[1],
    }));
    const headers = Object.keys(reportData[0] || {});
    const csv = [
      headers.join(","),
      ...reportData.map((row) =>
        headers.map((h) => JSON.stringify(row[h])).join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Staff_Performance_Report.csv";
    a.click();
  };

  // Update SLA timers every second
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

  const handleAssign = async () => {
    if (!assignData.complaintId || !assignData.staffId)
      return alert("Select complaint & staff");

    try {

      const res = await axiosInstance.patch("/api/complaints/assign", assignData);
      console.log("in handle assign function");

      alert(res.data.message);

      setComplaints((prev) =>
        prev.map((c) => (c._id === res.data.complaint._id ? res.data.complaint : c))
      );

      setAssignData({ complaintId: "", staffId: "" });
    } catch {
      alert("Assign failed");
    }
  };
  const handleBulkAssign = async () => {
    if (!assignData.staffId || selectedComplaints.length === 0) {
      return alert("Select staff and complaints");
    }

    try {
      const res = await axiosInstance.patch(
        "/api/complaints/assign-bulk",
        {
          staffId: assignData.staffId,
          complaintIds: selectedComplaints,
        }
      );

      alert(`✅ Assigned ${res.data.updated} complaints`);


      setSelectedComplaints([]);
      setActiveView("dashboard");
    } catch (err) {
      alert("Bulk assignment failed");
    }
  };

  if (loading)
    return (
      <div className="text-yellow-400 text-center mt-20 text-xl font-semibold">
        Loading Admin Dashboard...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#020b1c] text-white relative font-inter overflow-hidden pt-20">


      <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[url('./assets/download.jpg')] bg-top blur-sm mix-blend-overlay"></div>

      {/* NEON GLOWS */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600 blur-[150px] opacity-20 top-[-100px] left-[-100px]"></div>
      <div className="absolute w-[500px] h-[500px] bg-cyan-400 blur-[150px] opacity-20 bottom-[-120px] right-[-150px]"></div>

      {/* SIDEBAR */}
      <aside className="w-full lg:w-64 bg-[#020b1c]/80 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-cyan-500/30 p-6 z-20 shadow-[0_5px_30px_rgba(0,243,255,0.1)] lg:shadow-[5px_0_30px_rgba(0,243,255,0.1)]">
        <h1 className="font-orbitron text-2xl text-cyan-400 text-center tracking-wider mt-4 lg:mt-20 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
          Admin Panel
        </h1>

        <p className="mt-3 text-center text-white/80 mb-6 lg:mb-0">👑 {username}</p>

        <div className="mt-6 flex lg:block overflow-x-auto space-x-4 lg:space-x-0 lg:space-y-3 pb-2 lg:pb-0">
          <button
            onClick={() => setActiveView("dashboard")}
            className={`w-auto lg:w-full whitespace-nowrap rounded-lg px-4 py-2 text-left transition font-semibold tracking-wide
      ${activeView === "dashboard"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"}`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveView("complaints")}
            className={`w-auto lg:w-full whitespace-nowrap rounded-lg px-4 py-2 text-left transition font-semibold tracking-wide
      ${activeView === "complaints"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"}`}
          >
            Complaints
          </button>

          <button
            onClick={() => setActiveView("users")}
            className={`w-auto lg:w-full whitespace-nowrap rounded-lg px-4 py-2 text-left transition font-semibold tracking-wide
      ${activeView === "users"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"}`}
          >
            Create User
          </button>
          <button
            onClick={() => setActiveView("staff-performance")}
            className={`w-auto lg:w-full whitespace-nowrap rounded-lg px-4 py-2 text-left transition font-semibold tracking-wide
      ${activeView === "staff-performance"
                ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"} lg:mb-4`}
          >
            Staff
          </button>

          <button onClick={() => setActiveView("bulk")} className={`w-auto lg:w-full whitespace-nowrap rounded-lg px-4 py-2 text-left transition font-semibold tracking-wide
        ${activeView === "bulk"
              ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.2)]"
              : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"}`}>Bulk Upload</button>

          {/* <button
            onClick={() => navigate("/dashboard/admin/staff-performance")}
            className="w-full bg-white/10 hover:bg-white/20 transition rounded-lg px-4 py-2 text-left"
          >
            Staff
          </button> */}


        </div>


      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 lg:p-10 z-10 mt-6 lg:mt-12 justify-center ">
        {activeView === "bulk" && <BulkUserUpload />}

        {activeView === "dashboard" && (
          <>
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10 max-w-5xl justify-center">
                <StatCard label="Total Complaints" value={stats.total} color="#FFD93C" />
                <StatCard label="Open" value={stats.open} color="#FF4444" />
                <StatCard label="In Progress" value={stats.inProgress} color="#00CFFF" />
                <StatCard label="Resolved" value={stats.resolved} color="#4CAF50" />
                <StatCard label="Closed" value={stats.closed} color="#9CA3AF" />
                <StatCard label="SLA Violations" value={stats.slaViolations} color="#FF0000" />
              </div>
            )}

            {/* ASSIGN COMPLAINT CARD */}
            <div className="glass-panel p-6 mb-10 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,243,255,0.1)] rounded-2xl">
              <h2 className="font-orbitron text-xl mb-4 text-cyan-400 drop-shadow-md">Assign Complaints</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* <select
                  value={assignData.complaintId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, complaintId: e.target.value })
                  }
                  className="p-3 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Complaint</option>
                  {complaints.map((c) => (
                    <option key={c._id} value={c._id} className="text-black">
                      {c.title} — ({c.status})
                    </option>
                  ))}
                </select> */}
                <select
                  value={assignData.complaintId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, complaintId: e.target.value })
                  }
                  className="p-3 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Complaint</option>
                  {complaints
                    // filter only unassigned complaints
                    .filter(c => !c.assigned_to)
                    .map((c) => (
                      <option key={c._id} value={c._id} className="text-black">
                        {c.title} — ({c.status})
                      </option>
                    ))}
                </select>


                <select
                  value={assignData.staffId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, staffId: e.target.value })
                  }
                  className="p-3 rounded-lg bg-white/20 border border-white/30 text-white focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Staff</option>
                  {staffList.map((s) => (
                    <option key={s._id} value={s._id} className="text-black">
                      {s.username}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssign}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-lg px-6 py-3 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition transform hover:scale-105"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Complaints Chart */}
            <div className="mb-10">
              <ComplaintsChart complaints={complaints} />
            </div>
          </>
        )}
        {activeView === "complaints" && (

          <>
            {/* complaint table */}
            <div className="mt-6 bg-white/10 p-4 rounded-xl flex gap-4 items-center">
              <select
                className="p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                value={assignData.staffId}
                onChange={(e) =>
                  setAssignData({ ...assignData, staffId: e.target.value })
                }
              >
                <option value="">Select Staff</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id} className="text-black">
                    {s.username}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkAssign}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] transition"
              >
                Assign Selected ({selectedComplaints.length})
              </button>
            </div>
            <div className="glass-panel border border-cyan-500/30 shadow-2xl rounded-2xl p-6">
              <h2 className="font-orbitron text-xl mb-4 text-cyan-400 drop-shadow-md">
                All Complaints
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead className="bg-blue-500 text-white">
                    <tr>
                      <th className="p-3">
                        <input
                          type="checkbox"
                          onChange={(e) =>
                            setSelectedComplaints(
                              e.target.checked ? complaints.map(c => c._id) : []
                            )
                          }
                        />
                      </th>
                      <th className="p-3 font-semibold">Title</th>

                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Assigned To</th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Deadline</th>
                      <th className="p-3 font-semibold">Comments</th>

                    </tr>
                  </thead>

                  <tbody>
                    {complaints.map((c) => (
                      <React.Fragment key={c._id}>
                        {/* MAIN COMPLAINT ROW */}
                        <tr className="bg-white/10 border-b border-white/20 hover:bg-white/20 transition">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedComplaints.includes(c._id)}
                              onChange={() => toggleComplaint(c._id)}
                            />
                          </td>

                          <td className="p-3">{c.title}</td>
                          <td className="p-3">{c.status}</td>
                          <td className="p-3">
                            {c.assigned_to?.username || "Unassigned"}
                          </td>
                          <td className="p-3">{c.category}</td>

                          <td
                            className="p-3 font-semibold"
                            style={{
                              color: timeLefts[c._id]?.total > 0 ? "#FFD700" : "#FF4C4C",
                            }}
                          >
                            {timeLefts[c._id]?.total > 0
                              ? `${timeLefts[c._id].days}d ${timeLefts[c._id].hours}h ${timeLefts[c._id].minutes}m ${timeLefts[c._id].seconds}s`
                              : "Deadline passed"}
                          </td>

                          {/* COMMENT BUTTON */}
                          <td className="p-3">
                            <button
                              onClick={() => toggleComments(c._id)}
                              className="px-3 py-1 text-sm rounded-lg border border-blue-400/50 text-blue-300 hover:bg-blue-500/20 transition"
                            >
                              💬
                            </button>
                          </td>
                        </tr>

                        {/* COMMENT SECTION ROW */}
                        {openComments[c._id] && (
                          <tr className="bg-black/40">
                            <td colSpan={7} className="p-4">
                              <div className="border-t border-blue-500/30 pt-3">
                                <CommentSection complaintId={c._id} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>


                </table>
              </div>
            </div>
          </>
        )}
        {activeView === "users" && (
          <CreateUserForm onCreated={() => setActiveView("dashboard")} />
        )}
        {activeView === "staff-performance" && (
          <>
            <main className="flex-1 p-10 z-10 mt-12">

              {/* HEADER */}
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h1 className="font-orbitron text-3xl text-cyan-400 drop-shadow-md">
                    Staff Performance
                  </h1>
                  <p className="text-white/60 text-sm">
                    Ratings and feedback summary for all staff
                  </p>
                </div>

                <button
                  onClick={generateReport}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Download Report (CSV)
                </button>
              </div>

              {/* FILTERS */}
              <div className="bg-white/10 p-6 rounded-xl mb-8 backdrop-blur-xl mt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    className="bg-white/20 p-3 rounded-lg text-white"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/20 p-3 rounded-lg text-black"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="rating-high">Best Rated First</option>
                    <option value="rating-low">Lowest Rated First</option>
                    <option value="total-ratings">Most Ratings First</option>
                  </select>

                  <div className="text-white/50 flex items-center">
                    {filteredAndSortedStaff.length} staff found
                  </div>
                </div>
              </div>

              {/* STAFF LIST */}
              <div className="space-y-4">
                {filteredAndSortedStaff.map((staff) => (
                  <div
                    key={staff._id}
                    className="bg-white/10 p-6 rounded-xl border border-white/20 shadow-2xl mb-10 backdrop-blur-xl"
                  >
                    <div className="flex justify-between">

                      {/* LEFT */}
                      <div>
                        <h3 className="text-xl text-cyan-300 font-bold">{staff.username}</h3>
                        <p className="text-white/60">{staff.email}</p>

                        <div className="flex items-center gap-3 mt-2">
                          {renderStars(staff.averageRating)}
                          <span className="text-white font-semibold">
                            {staff.averageRating.toFixed(1)}
                          </span>
                          <span className="text-white/50">
                            ({staff.totalRatings} ratings)
                          </span>
                        </div>
                      </div>

                      {/* RIGHT – DISTRIBUTION */}
                      <div className="flex gap-3">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="text-center">
                            <span className="text-xs">{star}★</span>
                            <div className="w-12 h-2 bg-white/20 rounded mt-1">
                              {staff.totalRatings > 0 && (
                                <div
                                  style={{
                                    width:
                                      (staff.distribution[star] /
                                        staff.totalRatings) *
                                      100 + "%",
                                  }}
                                  className="h-full bg-cyan-400 rounded shadow-[0_0_8px_cyan]"
                                />
                              )}

                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </main>
          </>
        )}

      </main>
      <AdminChatbotWidget />
    </div>


  );
};

export default AdminDashboard;

// for SLA timer
function calculateTimeLeft(deadline) {
  if (!deadline) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  const now = new Date().getTime();
  const due = new Date(deadline).getTime();
  const diff = due - now;
  const total = diff;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { total, days, hours, minutes, seconds };
}
