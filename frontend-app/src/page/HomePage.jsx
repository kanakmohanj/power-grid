
import React from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-container">
     

      
      <div className="overlay"></div>

      <div className="content">
        <h2 className="title">Welcome to Fault Analyzer</h2>
     
        <div className="buttons">
          <Link to="/login" className="btn login-btn">
            Login
          </Link>
          <Link to="/register" className="btn register-btn">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
