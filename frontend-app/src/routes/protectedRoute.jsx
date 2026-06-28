import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute component
 * @param {ReactNode} children - The component(s) to render if authorized
 * @param {Array} allowedRoles - Array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  // Get token and user info from localStorage
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }


  // If no token → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is defined and user role is not included → redirect to home/login
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    alert("You are not authorized to access this page!");
    return <Navigate to="/" replace />;
  }

  // User is authorized → render the child component
  return children;
};

export default ProtectedRoute;

