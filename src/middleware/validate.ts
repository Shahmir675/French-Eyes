import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/errors.js";

type ValidationType = "body" | "query" | "params";

export function validate(schema: ZodSchema, type: ValidationType = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[type];
      const result = schema.parse(dataToValidate);
      req[type] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(AppError.validation("Validation failed", details));
        return;
      }
      next(error);
    }
  };
}
