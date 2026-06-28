import redisClient from "../Configs/redisClient.js";

export const rateLimiter = (keyPrefix, limit, windowSec) => {
  return async (req, res, next) => {
    try {
      const identifier = req.user?.id || req.ip;
      const key = `${keyPrefix}:${identifier}`;

      const count = await redisClient.incr(key);
      console.log(`Rate limiter: ${key} - Count: ${count}/${limit}`);

      if (count === 1) {
        await redisClient.expire(key, windowSec);
      }

      if (count > limit) {
        const ttl = await redisClient.ttl(key);
        const remainingTime = ttl > 0 ? ttl : windowSec;

        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Maximum ${limit} attempts per ${windowSec} seconds. Please try again in ${remainingTime} seconds.`,
          remainingTime,
          limit,
          retryAfter: remainingTime
        });
      }

      next();
    } catch (err) {
      console.error("Rate limiter error:", err);
      next();
    }
  };
};
