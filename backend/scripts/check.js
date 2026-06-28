// scripts/test-enqueue.js
import { taskQueue } from "../src/queues/queue.js"; // adjust path to your project
const userId = "6935de0bf645be2be5dd4223"; // replace
(async () => {
  await taskQueue.add("sendNotification", {
    userId,
    title: "Manual test message",
    body: "This is a manual notification test from server."
  }, { attempts: 1 });
  console.log("Enqueued test notification");
  process.exit(0);
})();
