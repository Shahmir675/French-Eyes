import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { config } from "../config/index.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  if (config.nodeEnv === "development") {
    console.error("Unhandled error:", err);
  }

  sendError(res, "INTERNAL_ERROR", "Internal server error", 500);
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, "NOT_FOUND", "Route not found", 404);
}
