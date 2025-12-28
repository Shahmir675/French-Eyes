import { Response } from "express";
import type { ApiResponse } from "../types/index.js";

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: { page?: number; limit?: number; total?: number }
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Array<{ field: string; message: string }>
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && details.length > 0) {
    response.error!.details = details;
  }

  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
