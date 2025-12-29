import { Router } from "express";
import { ProductController } from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import {
  productIdParamSchema,
  productQuerySchema,
  searchQuerySchema,
  paginationQuerySchema,
} from "../validators/product.validator.js";

const router = Router();

router.get(
  "/",
  validate(productQuerySchema, "query"),
  ProductController.getAll
);

router.get(
  "/featured",
  validate(paginationQuerySchema, "query"),
  ProductController.getFeatured
);

router.get(
  "/search",
  validate(searchQuerySchema, "query"),
  ProductController.search
);

router.get(
  "/:id",
  validate(productIdParamSchema, "params"),
  ProductController.getById
);

export default router;
