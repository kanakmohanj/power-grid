// src/page/Citizen/ComplaintLifecycle.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "../../api/axiosInstance";
import { Rating, Star } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";

import CommentSection from "./CommentSection";

export default function ComplaintLifecycle() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editComplaint, setEditComplaint] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  const [timeLefts, setTimeLefts] = useState({});
  const [ratings, setRatings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("complaintRatings")) || {};
    } catch {
      return {};
    }
  });

  // ✅ ADD: comment toggle state
  const [openComments, setOpenComments] = useState({});

  // ✅ ADD: toggle function
  const toggleComments = (complaintId) => {
    setOpenComments((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  /* ---------------- FETCH COMPLAINTS ---------------- */

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view complaints.");
      setLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.get("/api/complaints", {
        headers: { "x-auth-token": token },
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setComplaints(data);

      const timers = {};
      data.forEach((c) => {
        timers[c._id] = calculateTimeLeft(c.deadline);
      });
      setTimeLefts(timers);

      const backendRatings = {};
      data.forEach((c) => {
        const myRatingObj = c.assigned_to?.ratings?.find(
          (r) => r.rater === localStorage.getItem("userId")
        );
        if (myRatingObj) {
          backendRatings[c._id] = myRatingObj.rating;
        }
      });

      const stored = (() => {
        try {
          return JSON.parse(localStorage.getItem("complaintRatings") || "{}");
        } catch {
          return {};
        }
      })();

      const merged = { ...stored, ...backendRatings };
      setRatings(merged);
      localStorage.setItem("complaintRatings", JSON.stringify(merged));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ---------------- SLA COUNTDOWN ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = {};
      complaints.forEach((c) => {
        updated[c._id] = calculateTimeLeft(c.deadline);
      });
      setTimeLefts(updated);
    }, 1000);

    return () => clearInterval(interval);
  }, [complaints]);

  /* ---------------- CRUD ---------------- */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this complaint?")) return;
    await axiosInstance.delete(`/api/complaints/${id}`);
    setComplaints((prev) => prev.filter((c) => c._id !== id));
  };

  const saveEdit = async () => {
    const formData = new FormData();
    formData.append("title", editComplaint.title);
    formData.append("description", editComplaint.description);
    formData.append("category", editComplaint.category);
    formData.append("priority", editComplaint.priority);

    if (editImageFile) {
      formData.append("photo", editImageFile);
    }

    const res = await axiosInstance.patch(
      `/api/complaints/${editComplaint._id}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setComplaints((prev) =>
      prev.map((c) => (c._id === res.data.complaint._id ? res.data.complaint : c))
    );

    setEditComplaint(null);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  /* ---------------- RATINGS ---------------- */

  const handleRatingChange = (complaintId, newRating) => {
    setRatings((prev) => {
      const updated = { ...prev, [complaintId]: newRating };
      localStorage.setItem("complaintRatings", JSON.stringify(updated));
      return updated;
    });
  };

  const submitRating = async (complaintId, ratingValue) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const complaint = complaints.find((c) => c._id === complaintId);
    if (!complaint?.assigned_to?._id) return;

    await axiosInstance.post(
      `/api/users/${complaint.assigned_to._id}/rate`,
      { rating: ratingValue },
      { headers: { "x-auth-token": token } }
    );
  };

  /* ---------------- UI ---------------- */

  if (loading) return <p className="text-[#B4FF5A]">Loading complaints...</p>;

  if (error)
    return (
      <div className="text-[#B4FF5A]">
        <p>{error}</p>
        <button onClick={fetchComplaints}>Retry</button>
      </div>
    );

  return (
    <>
      <div className="space-y-6 mt-6">
        {complaints.map((c) => {
          const timeLeft = timeLefts[c._id];
          const isOverdue = timeLeft?.total <= 0;

          return (
            <div
              key={c._id}
              className="
              relative
              glass-panel
              rounded-2xl
              border border-cyan-500/30
              p-6
              shadow-[0_0_15px_rgba(0,243,255,0.05)]
              hover:shadow-[0_0_25px_rgba(0,243,255,0.15)]
              transition-all
            "
            >
              {/* STATUS BADGE */}
              <span
                className={`
                absolute top-4 left-4 px-3 py-1 text-xs rounded-full font-semibold border
                ${c.status === "OPEN"
                    ? "bg-yellow-400/10 text-yellow-300 border-yellow-400/30"
                    : c.status === "RESOLVED"
                      ? "bg-green-400/10 text-green-300 border-green-400/30"
                      : "bg-blue-400/10 text-blue-300 border-blue-400/30"
                  }
              `}
              >
                {c.status}
              </span>

              {/* COMMENT TOGGLE */}
              <button
                onClick={() => toggleComments(c._id)}
                className="
                absolute top-4 right-4
                px-3 py-1 text-xs font-semibold
                rounded-md
                border border-cyan-400/40
                text-cyan-300
                bg-black/30
                hover:bg-cyan-500/20
                hover:scale-105
                transition-all
              "
              >
                {openComments[c._id] ? "Close" : "Comments"}
              </button>

              {/* CONTENT */}
              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-bold font-orbitron text-cyan-400 drop-shadow-md">
                  {c.title}
                </h3>

                <p className="text-cyan-100/80 leading-relaxed font-inter">
                  {c.description}
                </p>
              </div>

              {/* SLA + RATING */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                {/* SLA */}
                {timeLeft && (
                  <p
                    className={`text-sm font-medium ${isOverdue ? "text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]" : "text-yellow-300"
                      }`}
                  >
                    {isOverdue
                      ? "⚠ Deadline passed"
                      : `⏱ ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`}
                  </p>
                )}

                {/* RATING */}
                {c.status == "RESOLVED" && (
                  <Rating
                    style={{ maxWidth: 120 }}
                    value={ratings[c._id] || 0}
                    onChange={(r) => {
                      submitRating(c._id, r);
                      handleRatingChange(c._id, r);
                    }}
                    itemStyles={{
                      itemShapes: Star,
                      activeFillColor: '#00f3ff',
                      inactiveFillColor: 'rgba(0, 243, 255, 0.2)'
                    }}
                  />
                )}
              </div>

              {/* COMMENTS PANEL */}
              {openComments[c._id] && (
                <div className="mt-6 pt-4 border-t border-cyan-500/20">
                  <CommentSection complaintId={c._id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

}

/* ---------------- UTIL ---------------- */

function calculateTimeLeft(deadline) {
  if (!deadline) return { total: 0 };
  const diff = new Date(deadline) - Date.now();
  return {
    total: diff,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
