import "@smastrom/react-rating/style.css";

import React, { useEffect, useContext } from "react";
import logo from "./assets/logo.png";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

import Register from "./page/auth/Register.jsx";
import Login from "./page/auth/Login.jsx";
import HomePage from "./page/HomePage.jsx";
import ComplaintForm from "./page/Citizen/ComplaintForm.jsx";
import AdminDashboard from "./page/Admin/AdminDashboard.jsx";
import StaffDashboard from "./page/Staff/StaffDashboard.jsx";
import CitizenDashboard from "./page/Citizen/CitizenDashboard.jsx";
// import StaffPerformance from "./page/Admin/StaffPerformance.jsx";
import ProtectedRoute from "./routes/protectedRoute.jsx";


//Notification
// import Messaging from "./Firebase/Messaging.jsx";
import { onMessage } from "firebase/messaging";
import { messaging } from "./Firebase/firebase";


// Auth context
import AuthProvider, { UserContext } from "./context/AuthContext.jsx";

/* ===============================
   🔔 Notification Handler
================================ */
function NotificationHandler() {
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (!user?.id) return;

    console.log("✅ NotificationHandler ACTIVE");

    // ask permission + save token


    // foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("🔔 Foreground notification:", payload);
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  return null;
}

/* ===============================
   🎨 UI Constants (Updated for Sci-Fi Theme)
================================ */
const THEME = {
  cyan: "#00f3ff",
  blue: "#0066ff",
  red: "#D4181F",
  white: "#FFFFFF",
  glassBorder: "rgba(0, 243, 255, 0.3)",
};

export function AuthButtons() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const btnBase = "px-4 py-2 rounded font-orbitron font-semibold text-xs md:text-sm uppercase tracking-wider transition-all duration-300 backdrop-blur-sm";

  return (
    <div className="flex gap-3 md:gap-4 items-center z-50">
      {!token ? (
        <>
          {/* Register - Cyan Theme */}
          <Link
            to="/register"
            className={`${btnBase} bg-cyan-400/10 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/20 hover:text-white hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:-translate-y-0.5`}
          >
            Register
          </Link>

          {/* Login - Blue Theme */}
          <Link
            to="/login"
            className={`${btnBase} bg-blue-600/10 border border-blue-600 text-[#4db8ff] hover:bg-blue-600/20 hover:text-white hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] hover:-translate-y-0.5`}
          >
            Login
          </Link>
        </>
      ) : (
        /* Logout */
        <button
          onClick={handleLogout}
          className={`${btnBase} bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.6)]`}
        >
          Logout
        </button>
      )}
    </div>
  );
}


function Navbar() {
  return (
    <nav className="fixed top-0 w-full h-20 flex justify-end items-center px-4 md:px-10 bg-[#020b1c]/80 backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.3)] z-[999]">

      {/* CENTER LOGO */}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex justify-center items-center pointer-events-none">
        <img
          src={logo}
          alt="Logo"
          className="h-12 md:h-16 lg:h-20 w-auto object-contain drop-shadow-[0_0_8px_rgba(0,243,255,0.3)]"
        />
      </div>

      <AuthButtons />
    </nav>
  );
}

export default function App() {

  // ✅ SERVICE WORKER REGISTRATION (ONCE)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => {
          console.log("✅ Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.error("❌ Service Worker failed:", err);
        });
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <NotificationHandler />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard/citizen"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/staff"
            element={
              <ProtectedRoute allowedRoles={["staff", "officer"]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/staff-performance"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
              </ProtectedRoute>
            }
          />



          <Route
            path="/complaint/new"
            element={
              <ProtectedRoute allowedRoles={["citizen"]}>
                <ComplaintForm />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<h1>404 Page Not Found</h1>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
