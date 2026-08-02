import User from "../models/User.js";
import { sendNotification, sendEmail } from "../firebase/SendNotification.js";

const buildEmailHTML = ({ title, username, description, status, deadline, extraMessage }) => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 15px;">
      <h2>${title}</h2>
      ${username ? `<p>Hi ${username},</p>` : ""}
      ${extraMessage ? `<p>${extraMessage}</p>` : ""}
      ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
      ${status ? `<p><strong>Status:</strong> ${status}</p>` : ""}
      ${deadline ? `<p><strong>Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>` : ""}
      
      <br/>
      <p>— DevSync Team</p>
    </div>
  `;
};

export const dispatchNotification = async (jobName, jobData) => {
  try {
    const { userId } = jobData;
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for notification:", jobName);
      return;
    }

    if (jobName === "sendNotification") {
      const { title, body } = jobData;
      if (user.fcmToken) {
        try {
          await sendNotification(user.fcmToken, title, body);
        } catch (err) {
          console.error("FCM Push Failed:", err);
        }
      }
      if (user.email) {
        try {
          const html = buildEmailHTML({ title, username: user.username, extraMessage: body });
          await sendEmail(user.email, title, body, html);
        } catch (err) {
          console.error("Email send failed:", err);
        }
      }
    } else if (jobName === "complaintAssigned") {
      const { complaintTitle } = jobData;
      const title = "New Complaint Assigned";
      const body = `Complaint "${complaintTitle}"`;
      if (user.fcmToken) {
        try {
          await sendNotification(user.fcmToken, title, body);
        } catch (err) {
          console.error("Assigned: FCM failed:", err);
        }
      }
      if (user.email) {
        try {
          const html = buildEmailHTML({ title, username: user.username, extraMessage: body });
          await sendEmail(user.email, title, body, html);
        } catch (err) {
          console.error("Email FAILED:", err);
        }
      }
    } else if (jobName === "deadlineAlert") {
      const { complaint, minutesRemaining } = jobData;
      const title = `IMPENDING DEADLINE: Complaint #${complaint._id}`;
      const body = `Deadline approaching in ${minutesRemaining} minutes.`;
      if (user.fcmToken) {
        try {
          await sendNotification(user.fcmToken, title, body);
        } catch (err) {
          console.error("Deadline: FCM FAILED:", err);
        }
      }
      if (user.email) {
        try {
          const html = buildEmailHTML({
            title,
            username: user.username,
            description: complaint.description,
            status: complaint.status,
            deadline: complaint.deadline,
            extraMessage: body,
          });
          await sendEmail(user.email, title, body, html);
        } catch (err) {
          console.error("Deadline: EMAIL FAILED:", err);
        }
      }
    } else if (jobName === "saveTokenConfirmation") {
      const title = "Notifications Activated";
      const body = "You accepted notification permission. You will get all updates via notification";
      if (user.fcmToken) {
        try {
          await sendNotification(user.fcmToken, title, body);
        } catch (err) {
          console.error("Token Confirmation: FCM FAILED:", err);
        }
      }
      if (user.email) {
        try {
          const html = buildEmailHTML({ title, username: user.username, extraMessage: body });
          await sendEmail(user.email, title, body, html);
        } catch (err) {
          console.error("Token Confirmation: EMAIL FAILED:", err);
        }
      }
    }
  } catch (err) {
    console.error("Error dispatching notification:", err);
  }
};
