import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service.js";
import { sendSuccess } from "../utils/response.js";
import type {
  ProductQueryInput,
  SearchQueryInput,
  PaginationQueryInput,
} from "../validators/product.validator.js";

export class ProductController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as ProductQueryInput;
      const result = await ProductService.getAll(query);
      sendSuccess(res, result.products, 200, result.meta);
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
      const result = await ProductService.getById(req.params["id"] as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async search(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as SearchQueryInput;
      const result = await ProductService.search(query);
      sendSuccess(res, result.products, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getFeatured(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = req.query as unknown as PaginationQueryInput;
      const result = await ProductService.getFeatured(query);
      sendSuccess(res, result.products, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
