import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import { syncFcmToken } from "../../Firebase/syncFcmToken";

export default function Login() {
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("logiingddffg");

      const res = await axiosInstance.post("/api/auth/login", formData);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        const role = res.data.user.role;

        if (role === "admin") navigate("/dashboard/admin");
        else if (role === "staff") navigate("/dashboard/staff");
        else navigate("/dashboard/citizen");
      } else {
        setError("Login failed. No token received.");
      }
    } catch (err) {
      // ---------------------------
      // 🔥 RATE LIMIT HANDLING HERE
      // ---------------------------
      if (err.response?.status === 429) {
        const msg =
          err.response?.data?.message ||
          "Too many attempts. Please try again later.";

        alert(msg); // popup alert
        setError(msg); // show in UI red text
      } else {
        setError(err.response?.data?.msg || "Invalid credentials.");
      }
    } finally {
      setIsLoading(false);
    }
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

          {/* REGISTER LINK */}
          <div className="mt-8 text-center">
            <p className="text-cyan-200/50 text-xs tracking-widest uppercase mb-2">Don’t have an account?</p>
            <span
              onClick={() => navigate("/register")}
              className="link-cyan cursor-pointer font-bold text-sm tracking-widest uppercase pb-1 border-b border-transparent hover:border-cyan-400"
            >
              Register
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
