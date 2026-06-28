import { Queue } from "bullmq";

export const taskQueue = new Queue("task-queue", {
  connection: {
    url: process.env.REDIS_URL,
  },
});

console.log("QUEUE CONNECTED:", {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

