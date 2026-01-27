import { Router } from "express";
import { CartController } from "../controllers/cart.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
  applyPromoSchema,
  calculateCartSchema,
} from "../validators/cart.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", CartController.getCart);

router.post(
  "/items",
  validate(addCartItemSchema),
  CartController.addItem
);

router.patch(
  "/items/:id",
  validate(cartItemIdParamSchema, "params"),
  validate(updateCartItemSchema),
  CartController.updateItem
);

router.delete(
  "/items/:id",
  validate(cartItemIdParamSchema, "params"),
  CartController.removeItem
);

router.delete("/", CartController.clearCart);

router.post(
  "/calculate",
  validate(calculateCartSchema),
  CartController.calculate
);

router.post(
  "/apply-promo",
  validate(applyPromoSchema),
  CartController.applyPromo
);

router.delete("/promo", CartController.removePromo);

export default router;
