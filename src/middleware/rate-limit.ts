import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";
import { sendError } from "../utils/response.js";

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, "TOO_MANY_REQUESTS", "Too many requests, please try again later", 429);
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, "TOO_MANY_REQUESTS", "Too many authentication attempts, please try again later", 429);
  },
});
