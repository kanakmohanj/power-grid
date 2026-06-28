import express from "express";
import User from "../models/User.js"; 
const router = express.Router();
router.post("/", async (req, res) => {
  const { userId, token } = req.body;
  await User.findByIdAndUpdate(userId, { fcmToken: token });
  res.send("Token saved!");
});
export default router;