import { Router } from "express";
import { DriverAuthController } from "../controllers/driver-auth.controller.js";
import { DriverController } from "../controllers/driver.controller.js";
import { authenticateDriver } from "../middleware/driver-auth.js";
import { validate } from "../middleware/validate.js";
import {
  driverLoginSchema,
  driverForgotPasswordSchema,
  updateProfileSchema,
  updateLocationSchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
  paginationQuerySchema,
  tipsQuerySchema,
  createSupportTicketSchema,
} from "../validators/driver.validator.js";

const router = Router();

router.post(
  "/auth/login",
  validate(driverLoginSchema, "body"),
  DriverAuthController.login
);

router.post(
  "/auth/forgot-password",
  validate(driverForgotPasswordSchema, "body"),
  DriverAuthController.forgotPassword
);

router.post("/auth/refresh", DriverAuthController.refreshToken);

router.use(authenticateDriver);

router.post("/auth/logout", DriverAuthController.logout);

router.get("/profile", DriverController.getProfile);

router.patch(
  "/profile",
  validate(updateProfileSchema, "body"),
  DriverController.updateProfile
);

router.patch(
  "/location",
  validate(updateLocationSchema, "body"),
  DriverController.updateLocation
);

router.get(
  "/orders",
  validate(paginationQuerySchema, "query"),
  DriverController.getOrders
);

router.get(
  "/orders/:id",
  validate(orderIdParamSchema, "params"),
  DriverController.getOrderById
);

router.patch(
  "/orders/:id/accept",
  validate(orderIdParamSchema, "params"),
  DriverController.acceptOrder
);

router.patch(
  "/orders/:id/status",
  validate(orderIdParamSchema, "params"),
  validate(updateOrderStatusSchema, "body"),
  DriverController.updateOrderStatus
);

router.get(
  "/history",
  validate(paginationQuerySchema, "query"),
  DriverController.getHistory
);

router.get(
  "/tips",
  validate(tipsQuerySchema, "query"),
  DriverController.getTips
);

router.get("/stats", DriverController.getStats);

router.post(
  "/support",
  validate(createSupportTicketSchema, "body"),
  DriverController.createSupportTicket
);

export default router;
