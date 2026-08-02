
import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
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
  return (
    <div className="home-container">



      <div className="overlay"></div>

      <div className="content">
        <h2 className="title">Welcome to Fault Analyzer</h2>

        <div className="buttons">
          <Link to="/login" className="btn login-btn">
            Login
          </Link>
          {/* <Link to="/register" className="btn register-btn">
            Register
          </Link> */}
        </div>
      </div>
    </div>
  );
}
