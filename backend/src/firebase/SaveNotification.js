
import User from "../models/User.js";
import { dispatchNotification } from "../helpers/notificationHelper.js";
const saveNotificationToken = async (req, res, next) => {
  try {
    console.log("Saving token...");

    const { fcmToken, userId } = req.body;
    if (!fcmToken || !userId) {
      return res.status(400).json({ message: "FCM token and User ID are required." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const previousToken = user.fcmToken;
    const isNewToken = !previousToken;
    const tokenChanged = previousToken && previousToken !== fcmToken;

    user.fcmToken = fcmToken;
    await user.save();
    console.log("Token saved:", fcmToken, "User:", userId);

    if (isNewToken || tokenChanged) {
      dispatchNotification("saveTokenConfirmation", {
        userId: user._id,
        fcmToken,
      }).catch((err) => console.error(err));
      console.log("Queued saveTokenConfirmation job for user:", userId);
    }

    return res.status(200).json({
      success: true,
      message: "FCM token saved and confirmation queued (if new or changed).",
    });
  } catch (error) {
    console.error("Error saving notification token:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
export { saveNotificationToken };
