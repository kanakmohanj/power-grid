

import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import redisClient from "../Configs/redisClient.js";
import bcrypt from "bcryptjs";
// import { sendEmail } from '../firebase/SendNotification.js';
import fs from "fs";
import csv from "csv-parser";
import { taskQueue } from '../queues/queue.js';


export const getAllStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const cacheKey = `staff_ratings_${tenantId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Staff ratings served from Redis");
      return res.status(200).json(JSON.parse(cached));
    }

    const staff = await User.find({ role: "staff", tenantId })
      .select("_id username email ratings");

    const staffWithStats = staff.map((member) => {
      const ratings = member.ratings || [];
      const totalRatings = ratings.length;

      const averageRating =
        totalRatings > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
          : 0;

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      ratings.forEach((r) => (distribution[r.rating] += 1));

      return {
        _id: member._id,
        username: member.username,
        email: member.email,
        ratings,
        totalRatings,
        averageRating: Number(averageRating.toFixed(2)),
        distribution,
      };
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(staffWithStats));
    console.log("Staff ratings cached in Redis");

    res.status(200).json(staffWithStats);

  } catch (err) {
    console.error("Error in getAllStaff:", err);
    res.status(500).json({ message: "Server error fetching staff" });
  }
};

// --------------------Stats--------------------------
export const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    const total = await Complaint.countDocuments({ submitted_by: userId, tenantId });
    const open = await Complaint.countDocuments({ submitted_by: userId, status: 'OPEN', tenantId });
    const closed = await Complaint.countDocuments({ submitted_by: userId, status: 'CLOSED', tenantId });
    const resolved = await Complaint.countDocuments({ submitted_by: userId, status: 'RESOLVED', tenantId });
    const inprogress = await Complaint.countDocuments({ submitted_by: userId, status: 'IN_PROGRESS', tenantId });

    const lastComplaint = await Complaint.findOne({ submitted_by: userId, tenantId })
      .sort({ updatedAt: -1 })
      .select("status title updatedAt");

    res.status(200).json({
      total,
      open,
      closed,
      resolved,
      inprogress,
      lastComplaintStatus: lastComplaint?.status || null
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error fetching data' });
  }
};

// -------------------AdminStats---------------------------
export const getAdminStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const cacheKey = `admin_stats_${tenantId}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ cached: true, ...JSON.parse(cached) });
    }

    const filter = { tenantId };

    const total = await Complaint.countDocuments(filter);
    const open = await Complaint.countDocuments({ ...filter, status: "OPEN" });
    const inProgress = await Complaint.countDocuments({ ...filter, status: "IN_PROGRESS" });
    const closed = await Complaint.countDocuments({ ...filter, status: "CLOSED" });
    const resolved = await Complaint.countDocuments({ ...filter, status: "RESOLVED" });

    const slaViolations = await Complaint.countDocuments({
      ...filter,
      status: { $nin: ["RESOLVED", "CLOSED"] },
      updatedAt: { $lt: new Date(Date.now() - 72 * 60 * 60 * 1000) }
    });

    const byCategory = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const byEngineer = await Complaint.aggregate([
      { $match: { ...filter, assigned_to: { $ne: null } } },
      { $group: { _id: "$assigned_to", count: { $sum: 1 } } }
    ]);

    const dailyTrend = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = {
      total,
      open,
      inProgress,
      closed,
      resolved,
      slaViolations,
      byCategory,
      byEngineer,
      dailyTrend
    };

    await redisClient.setEx(cacheKey, 300, JSON.stringify(stats));

    res.json({ cached: false, ...stats });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to load admin stats" });
  }
};

// -------------------Staffstat--------------------------------------
export const getStaffStats = async (req, res) => {
  try {
    const staffId = req.user.id;
    const tenantId = req.user.tenantId;

    const baseFilter = { assigned_to: staffId, tenantId };

    const total = await Complaint.countDocuments(baseFilter);
    const open = await Complaint.countDocuments({ ...baseFilter, status: "OPEN" });
    const assigned = await Complaint.countDocuments({ ...baseFilter, status: "ASSIGNED" });
    const inProgress = await Complaint.countDocuments({ ...baseFilter, status: "IN_PROGRESS" });
    const resolved = await Complaint.countDocuments({ ...baseFilter, status: "RESOLVED" });
    const closed = await Complaint.countDocuments({ ...baseFilter, status: "CLOSED" });

    const slaViolations = await Complaint.countDocuments({
      ...baseFilter,
      status: { $nin: ["RESOLVED", "CLOSED"] },
      updatedAt: {
        $lt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    });

    const latest = await Complaint.findOne(baseFilter)
      .sort({ updatedAt: -1 })
      .select("title status updatedAt");

    res.json({
      total,
      open,
      assigned,
      inProgress,
      resolved,
      closed,
      slaViolations,
      latest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching staff stats" });
  }
};

// ------------------User----------------------------
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("username email role fcmToken");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ----------------------------------------------
export const adminCreateUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Forbidden" });
  }

  const { username, email, password, role } = req.body;

  if (!["staff", "citizen"].includes(role)) {
    return res.status(400).json({ msg: "Invalid role" });
  }

  const exists = await User.findOne({
    tenantId: req.user.tenantId,
    $or: [{ email }, { username }],
  });

  if (exists) {
    return res.status(400).json({ msg: "User already exists in this tenant" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email: email.toLowerCase(),
    password: hashed,
    role,
    tenantId: req.user.tenantId,
  });

  await taskQueue.add("sendNotification", {
  userId: user._id,
  title: "Welcome to DevSync!",
  body: "Welcome aboard! Your DevSync account is ready. You can now log in and start using the system.",
  htmlMessage: `
    <h2>Welcome to DevSync!</h2>
    <p>Hello ${user.username},</p>
    <p>Your account has been created successfully. You can now log in and access your dashboard.</p>
    <br/>
    <p>— DevSync Team</p>
  `,

});
  res.status(201).json({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
};
// export const hi = async (req, res) => {
//   console.log("hi");
//   res.send("hi");
// };

export const bulkCreateUsers = async (req, res) => {
  console.log("yes")
  if (!req.file) {
    return res.status(400).json({ msg: "CSV file required" });
  }

  const rows = [];
  const tenantId = req.user.tenantId;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      if (row.email && row.username) {
        rows.push(row);
      }
    })
    .on("end", async () => {
      try {
        const usersToInsert = [];
        const emailQueue = [];

        for (const row of rows) {
          const plainPassword = Math.random().toString(36).slice(-10);
          const hashedPassword = await bcrypt.hash(plainPassword, 10);

          usersToInsert.push({
            username: row.username.trim(),
            email: row.email.trim().toLowerCase(),
            role: row.role || "citizen",
            password: hashedPassword,
            tenantId,
          });

          emailQueue.push({
            email: row.email,
            username: row.username,
            password: plainPassword,
          });
        }

        const createdUsers = await User.insertMany(usersToInsert, {
          ordered: false,
        });

       
        for (const u of emailQueue) {
          await sendEmail(
            u.email,
            "Your DevSync Account",
            `Your account is ready`,
            `
            <h3>Welcome to DevSync</h3>
            <p><b>Username:</b> ${u.username}</p>
            <p><b>Password:</b> ${u.password}</p>
            <p>Please login and change your password immediately.</p>
            `
          );
        }

        return res.json({
          success: true,
          created: createdUsers.length,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Bulk upload failed" });
      }
    });
};
export const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ message: "Token missing" });

    await User.findByIdAndUpdate(req.user.id, {
      fcmToken,
      tokenUpdatedAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Save token error", err);
    res.status(500).json({ message: "Server error" });
  }
};

// export const getAdminStats = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();
//     const staffCount = await User.countDocuments({ role: 'staff' });
//     const citizenCount = await User.countDocuments({ role: 'citizen' });
//     const adminCount = await User.countDocuments({ role: 'admin' });
    
//     res.status(200).json({
//       totalUsers,
//       staffCount,
//       citizenCount,
//       adminCount
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error fetching admin stats' });
//   }
// };
