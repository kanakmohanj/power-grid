import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

console.log("=== REDIS DEBUG INFO ===");
console.log("🔍 REDIS_URL exists:", !!redisUrl);
console.log("🔍 REDIS_URL length:", redisUrl ? redisUrl.length : 0);
console.log("🔍 REDIS_URL starts with 'redis://':", redisUrl ? redisUrl.startsWith('redis://') : false);
console.log("🔍 REDIS_URL (first 20 chars):", redisUrl ? redisUrl.substring(0, 20) : 'NOT SET');
console.log("========================");

if (!redisUrl) {
  console.error("❌ REDIS_URL is not set!");
  process.exit(1); // Stop server if Redis URL is missing
}

const redisClient = createClient({
  url: redisUrl,
  socket: {
    
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.error("❌ Redis: Stopping reconnection after 5 attempts");
        return new Error("Too many retries");
      }
      const delay = Math.min(retries * 500, 2000);
      console.log(`⏳ Redis: Retry ${retries}, waiting ${delay}ms...`);
      return delay;
    },
  },
});

redisClient.on("error", (err) => {
  console.error("⚠️ Redis Error:", err.message);
  console.error("⚠️ Error code:", err.code);
});

redisClient.on("connect", () => {
  console.log("✅ Redis TCP connection established");
});

redisClient.on("ready", () => {
  console.log("✅ Redis is ready to accept commands");
});

(async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connection successful");
  } catch (err) {
    console.error("❌ Failed to connect to Redis:");
    console.error("   Error:", err.message);
    console.error("   Code:", err.code);
  }
})();

export default redisClient;