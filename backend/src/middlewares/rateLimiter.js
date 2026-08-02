export const rateLimiter = (keyPrefix, limit, windowSec) => {
  return (req, res, next) => {
    next();
  };
};

