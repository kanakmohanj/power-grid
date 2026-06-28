import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../page/auth/Login";
import Register from "../page/auth/Register";
import CitizenDashboard from "../page/Citizen/CitizenDashboard";
import StaffDashboard from "../page/Staff/StaffDashboard";
import AdminDashboard from "../page/Admin/AdminDashboard";
import ProtectedRoute from "../components/protectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
     
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Routes>
  <Route path="/dashboard/citizen" element={
    <ProtectedRoute allowedRoles={["citizen"]}>
      <CitizenDashboard />
    </ProtectedRoute>
  } />+

  <Route path="/dashboard/staff" element={
    <ProtectedRoute allowedRoles={["staff", "admin"]}>
      <StaffDashboard />
    </ProtectedRoute>
  } />

  <Route path="/dashboard/admin" element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  } />
</Routes>

     
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

