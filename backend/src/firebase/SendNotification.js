import admin from "./FirebaseAdmin.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { taskQueue } from "../queues/queue.js";
import Complaint from "../models/Complaint.js";
import User from "../models/User.js";
import cron from "node-cron";

dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
  secure: process.env.EMAIL_SECURE === "true",
   // for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify()
  .then(() => console.log("Email transporter ready"))
  .catch((err) => console.error("Email transporter error:", err));

export async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: `"DevSync" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} (${subject})`);
  } catch (err) {
    console.error("Error sending email:", err);
    throw err;
  }
}

export async function sendNotification(token, title, body) {
  const message = { notification: { title, body }, token };

  try {
    await admin.messaging().send(message);
    console.log(`FCM sent to token: ${token}`);
  } catch (err) {
    console.error("Error sending FCM:", err);
    throw err;
  }
}


export const startDeadlineCron = () => {
  // run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("Cron: checking for impending deadlines", new Date().toLocaleString());

    try {
      const now = new Date();

      const impendingComplaints = await Complaint.find({
        status: { $nin: ["RESOLVED", "CLOSED"] },
        deadline: { $ne: null, $lte: new Date(now.getTime() + 60 * 60 * 1000) }, // within next hour
      }).populate("assigned_to", "username email fcmToken");

      for (const complaint of impendingComplaints) {
        const staffUser = complaint.assigned_to;
        if (!staffUser) continue;

        const timeRemainingMs = complaint.deadline.getTime() - now.getTime();
        const minutesRemaining = Math.round(timeRemainingMs / (1000 * 60));

        if (minutesRemaining <= 0 || minutesRemaining > 60) continue;

        // duplicate enqueue within last hour
        if (complaint.lastDeadlineAlerted) {
          const lastAlert = new Date(complaint.lastDeadlineAlerted);
          if (now.getTime() - lastAlert.getTime() < 60 * 60 * 1000) {
            console.log(`Complaint ${complaint._id} already alerted within last hour.`);
            continue;
          }
        }

        // Enqueue Alert 
        await taskQueue.add("deadlineAlert", {
          userId: staffUser._id,
          complaint: {
            _id: complaint._id,
            title: complaint.title,
            description: complaint.description,
            status: complaint.status,
            deadline: complaint.deadline,
          },
          minutesRemaining,
        });

        // save lastDeadlineAlerted
        complaint.lastDeadlineAlerted = now;
        await complaint.save();

        console.log(`Enqueued deadlineAlert for complaint ${complaint._id} to user ${staffUser._id}`);
      }
    } catch (err) {
      console.error("Error in cron job:", err);
    }
  });

  console.log("Cron job scheduled: checking complaint deadlines every 15 minutes.");
};
