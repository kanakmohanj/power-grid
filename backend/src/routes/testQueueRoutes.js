import express from "express";
import { taskQueue } from "../queues/queue.js";

const router = express.Router();

router.post("/notify", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    await taskQueue.add("saveTokenConfirmation", {
      userId,
      title: "Test Notification from API",
      body: "If you see this in worker logs, the queue is working correctly."
    });

    console.log("Test job added to queue");

    res.json({
      success: true,
      message: "Test job added to queue",
      jobType: "sendNotification",
      userId
    });
  } catch (err) {
    console.error("Error adding test job:", err);
    res.status(500).json({ message: "Failed to add test job", error: err.message });
  }
});

export default router;
