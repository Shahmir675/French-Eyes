import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  getNotificationsQuerySchema,
  notificationIdParamSchema,
} from "../validators/notification.validator.js";

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// Get all notifications
router.get(
  "/",
  validate(getNotificationsQuerySchema, "query"),
  NotificationController.getAll
);

// Get unread count
router.get("/unread-count", NotificationController.getUnreadCount);

// Mark all as read
router.patch("/read-all", NotificationController.markAllAsRead);

// Mark single notification as read
router.patch(
  "/:id/read",
  validate(notificationIdParamSchema, "params"),
  NotificationController.markAsRead
);

// Delete notification
router.delete(
  "/:id",
  validate(notificationIdParamSchema, "params"),
  NotificationController.delete
);

export default router;
