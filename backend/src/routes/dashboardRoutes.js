import express from "express";
import { protect, authorizeRoles } from "../middlewares/auth.js";
import { getAdminStats } from "../controllers/userController.js";
import { getStaffStats } from "../controllers/userController.js";

const router = express.Router();
console.log("Dashboard routes loaded");


import User from "../models/User.js";

router.get("/citizen", protect, authorizeRoles("citizen"), async (req, res) => {
  const user = await User.findById(req.user.id).select("username role");
  if (!user) return res.status(404).json({ msg: "User not found" });

  res.json({
    success: true,
    role: user.role,
    msg: `Welcome citizen ${user.username}`,
  });
});


router.get("/staff", protect, authorizeRoles("staff", "admin"), (req, res) => {
  res.json({
    success: true,
    role: "staff",
    msg: `Welcome staff ${req.user.username}`,
  });
});
console.log('dashboard routesss')

router.get("/admin", protect, authorizeRoles("admin"), (req, res) => {
  res.json({
    success: true,
    role: "admin",
    msg: `Welcome admin ${req.user.username}`,
  });
});



console.log('reached')
export default router;
