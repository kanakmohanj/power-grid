import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user?.role;
        if (role === "admin") navigate("/dashboard/admin", { replace: true });
        else if (role === "staff" || role === "officer") navigate("/dashboard/staff", { replace: true });
        else navigate("/dashboard/citizen", { replace: true });
      } catch (err) {
        console.error("Error parsing user from localStorage:", err);
      }
    }
  }, [navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const loginWithCredentials = async (credentials) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("/api/auth/login", credentials);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        const role = res.data.user.role;

        if (role === "admin") navigate("/dashboard/admin");
        else if (role === "staff" || role === "officer") navigate("/dashboard/staff");
        else navigate("/dashboard/citizen");
      } else {
        setError("Login failed. No token received.");
      }
    } catch (err) {
      if (err.response?.status === 429) {
        const msg =
          err.response?.data?.message ||
          "Too many attempts. Please try again later.";

        alert(msg);
        setError(msg);
      } else {
        setError(err.response?.data?.msg || "Invalid credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginWithCredentials(formData);
  };

  const handleDemoAdmin = () => {
    const creds = { identifier: "admin2026", password: "123456" };
    setFormData(creds);
    loginWithCredentials(creds);
  };

  const handleDemoStaff = () => {
    const creds = { identifier: "ishitaSingh", password: "123456" };
    setFormData(creds);
    loginWithCredentials(creds);
  };

  const handleDemoCitizen = () => {
    const creds = { identifier: "AVNIK", password: "123456" };
    setFormData(creds);
    loginWithCredentials(creds);
  };

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* AMBIENT ORBS */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/20 blur-[120px] top-[-100px] left-[-150px] pointer-events-none mix-blend-screen animate-pulse"></div>
      <div className="absolute w-[500px] h-[500px] bg-cyan-400/10 blur-[120px] bottom-[-100px] right-[-150px] pointer-events-none mix-blend-screen animate-pulse"></div>

      {/* ANIMATION WRAPPER */}
      <div className="w-full max-w-md animate-fade-in-up relative z-10">

        {/* FLOATING CARD */}
        <div className="glass-panel p-10 animate-float border border-cyan-500/30 ">

          {/* TITLE */}
          <h2 className="neon-text text-3xl font-bold text-center mb-8 tracking-wider">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* IDENTIFIER */}
            <div className="group">
              <label className="block mb-2 text-cyan-50 font-bold font-orbitron text-xs tracking-widest uppercase shadow-black drop-shadow-md">
                Email or Username
              </label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                placeholder="Enter email or username"
                onChange={handleChange}
                required
                className="neon-input w-full p-4 rounded-lg bg-black/40 text-white font-semibold placeholder-cyan-200/60 focus:bg-cyan-900/20 border-cyan-500/50"
              />
            </div>

            {/* PASSWORD */}
            <div className="group">
              <label className="block mb-2 text-cyan-50 font-bold font-orbitron text-xs tracking-widest uppercase shadow-black drop-shadow-md">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                placeholder="Enter password"
                onChange={handleChange}
                required
                minLength={6}
                className="neon-input w-full p-4 rounded-lg bg-black/40 text-white font-semibold placeholder-cyan-200/60 focus:bg-cyan-900/20 border-cyan-500/50"
              />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-3 rounded border border-red-500/30 bg-red-500/10 text-red-200 text-sm text-center font-bold tracking-wide shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                ⚠ {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="neon-btn w-full py-4 rounded-lg font-bold text-lg bg-gradient-to-r from-blue-600/20 to-cyan-400/20 hover:from-blue-600/40 hover:to-cyan-400/40 border border-cyan-400/50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* DEMO LOGIN BUTTONS */}
          <div className="mt-6 pt-6 border-t border-cyan-500/20">
            <p className="text-center text-cyan-200/60 text-xs font-orbitron tracking-widest uppercase mb-4">
              ⚡ Quick Demo Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDemoAdmin}
                className="py-2.5 px-2 rounded bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 font-orbitron text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-300 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all duration-200 cursor-pointer"
              >
                {isLoading ? "..." : "Admin Demo"}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDemoStaff}
                className="py-2.5 px-2 rounded bg-blue-500/10 border border-blue-400/40 text-blue-300 font-orbitron text-xs font-semibold hover:bg-blue-400/20 hover:border-blue-300 hover:shadow-[0_0_10px_rgba(0,102,255,0.3)] transition-all duration-200 cursor-pointer"
              >
                {isLoading ? "..." : "Staff Demo"}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDemoCitizen}
                className="py-2.5 px-2 rounded bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 font-orbitron text-xs font-semibold hover:bg-emerald-400/20 hover:border-emerald-300 hover:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer"
              >
                {isLoading ? "..." : "Citizen Demo"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
