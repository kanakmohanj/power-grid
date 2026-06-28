import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "citizen",
    tenantCode: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password.length < 6) {
      setError("⚠️ Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axiosInstance.post("/api/auth/register", formData);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* AMBIENT ORBS */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[130px] top-[-100px] left-[-150px] pointer-events-none mix-blend-screen animate-pulse"></div>
      <div className="absolute w-[600px] h-[600px] bg-cyan-400/10 blur-[130px] bottom-[-100px] right-[-150px] pointer-events-none mix-blend-screen animate-pulse"></div>

      <div className="w-full max-w-md animate-fade-in-up relative z-10">

        <div className="glass-panel p-10 animate-float border border-cyan-500/30">

          <h2 className="neon-text text-2xl font-bold text-center mb-8 tracking-wider leading-relaxed">
            Admin Onboarding
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="group">
              <label className="block mb-1 text-cyan-50 font-bold font-orbitron text-xs tracking-widest uppercase shadow-black drop-shadow-md">
                Username
              </label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                onChange={handleChange}
                required
                className="neon-input w-full p-3 rounded-lg bg-black/40 text-white font-semibold placeholder-cyan-200/60 focus:bg-cyan-900/20 border-cyan-500/50"
              />
            </div>

            <div className="group">
              <label className="block mb-1 text-cyan-50 font-bold font-orbitron text-xs tracking-widest uppercase shadow-black drop-shadow-md">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                onChange={handleChange}
                required
                className="neon-input w-full p-3 rounded-lg bg-black/40 text-white font-semibold placeholder-cyan-200/60 focus:bg-cyan-900/20 border-cyan-500/50"
              />
            </div>

            <div className="group">
              <label className="block mb-1 text-cyan-50 font-bold font-orbitron text-xs tracking-widest uppercase shadow-black drop-shadow-md">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                onChange={handleChange}
                required
                minLength={6}
                className="neon-input w-full p-3 rounded-lg bg-black/40 text-white font-semibold placeholder-cyan-200/60 focus:bg-cyan-900/20 border-cyan-500/50"
              />
            </div>

            <div className="group">
              <label className="block mb-1 text-cyan-50 font-bold font-orbitron text-xs tracking-widest uppercase shadow-black drop-shadow-md">
                Tenant Code
              </label>
              <input
                type="text"
                name="tenantCode"
                placeholder="e.g. CHN, DEL, BLR"
                onChange={handleChange}
                required
                className="neon-input w-full p-3 rounded-lg bg-black/40 text-white font-semibold placeholder-cyan-200/60 focus:bg-cyan-900/20 border-cyan-500/50 uppercase"
              />
            </div>

            {error && (
              <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-200 text-sm text-center font-bold tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                ⚠ {error}
              </div>
            )}

            <button
              className="neon-btn w-full py-4 rounded-lg font-bold text-lg mt-4 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 hover:from-blue-600/40 hover:to-cyan-400/40 border border-cyan-400/50"
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-cyan-200/50 text-xs tracking-widest uppercase mb-2">Already have an account?</p>
            <span
              className="link-cyan cursor-pointer font-bold text-sm tracking-widest uppercase pb-1 border-b border-transparent hover:border-cyan-400"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
