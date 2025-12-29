import { Request, Response, NextFunction } from "express";
import { CategoryService } from "../services/category.service.js";
import { sendSuccess } from "../utils/response.js";

export class CategoryController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await CategoryService.getAll();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await CategoryService.getById(req.params["id"] as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
