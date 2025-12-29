import { Router } from "express";
import { CategoryController } from "../controllers/category.controller.js";
import { validate } from "../middleware/validate.js";
import { categoryIdParamSchema } from "../validators/product.validator.js";

const router = Router();

router.get("/", CategoryController.getAll);

router.get(
  "/:id",
  validate(categoryIdParamSchema, "params"),
  CategoryController.getById
);

export default router;
