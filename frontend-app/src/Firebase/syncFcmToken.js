import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import axiosInstance from "../api/axiosInstance";

export const syncFcmToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const reg = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });

    if (!token) return;

    await axiosInstance.post("/api/v1/save-token", {
      fcmToken: token,
    });

    console.log("✅ FCM token synced");
  } catch (err) {
    console.warn("❌ FCM sync failed", err);
  }
};
