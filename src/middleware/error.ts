import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { config } from "../config/index.js";

interface MongooseCastError extends Error {
  kind?: string;
  path?: string;
  value?: unknown;
}

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

  const castError = err as MongooseCastError;
  if (err.name === "CastError" && castError.kind === "ObjectId") {
    sendError(res, "VALIDATION_ERROR", "Invalid ID format", 400, [
      { field: castError.path || "id", message: "Invalid ID format" },
    ]);
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
