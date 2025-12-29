import { Router } from "express";
import { OrderController } from "../controllers/order.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createOrderSchema,
  orderIdParamSchema,
  getOrdersQuerySchema,
  cancelOrderSchema,
  reviewOrderSchema,
} from "../validators/order.validator.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createOrderSchema), OrderController.createOrder);

router.get("/", validate(getOrdersQuerySchema, "query"), OrderController.getOrders);

router.get(
  "/:id",
  validate(orderIdParamSchema, "params"),
  OrderController.getOrderById
);

router.get(
  "/:id/track",
  validate(orderIdParamSchema, "params"),
  OrderController.trackOrder
);

router.post(
  "/:id/cancel",
  validate(orderIdParamSchema, "params"),
  validate(cancelOrderSchema),
  OrderController.cancelOrder
);

router.post(
  "/:id/review",
  validate(orderIdParamSchema, "params"),
  validate(reviewOrderSchema),
  OrderController.reviewOrder
);

router.post(
  "/:id/reorder",
  validate(orderIdParamSchema, "params"),
  OrderController.reorder
);

export default router;
