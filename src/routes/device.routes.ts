import { Router } from "express";
import { DeviceController } from "../controllers/device.controller.js";
import { authenticateAdmin } from "../middleware/admin-auth.js";
import { validate } from "../middleware/validate.js";
import {
  registerDeviceSchema,
  updateDeviceSettingsSchema,
  deviceIdParamSchema,
} from "../validators/device.validator.js";
import { z } from "zod";

const router = Router();

const updateStatusSchema = z.object({
  status: z.enum(["active", "inactive", "offline"]),
});

router.post(
  "/register",
  authenticateAdmin,
  validate(registerDeviceSchema),
  DeviceController.register
);

router.get("/", authenticateAdmin, DeviceController.list);

router.get(
  "/:id",
  authenticateAdmin,
  validate(deviceIdParamSchema, "params"),
  DeviceController.getById
);

router.delete(
  "/:id",
  authenticateAdmin,
  validate(deviceIdParamSchema, "params"),
  DeviceController.unregister
);

router.patch(
  "/:id/settings",
  authenticateAdmin,
  validate(deviceIdParamSchema, "params"),
  validate(updateDeviceSettingsSchema),
  DeviceController.updateSettings
);

router.post(
  "/:id/test",
  authenticateAdmin,
  validate(deviceIdParamSchema, "params"),
  DeviceController.sendTestPrint
);

router.post(
  "/:id/regenerate-token",
  authenticateAdmin,
  validate(deviceIdParamSchema, "params"),
  DeviceController.regenerateToken
);

router.patch(
  "/:id/status",
  authenticateAdmin,
  validate(deviceIdParamSchema, "params"),
  validate(updateStatusSchema),
  DeviceController.updateStatus
);

router.get("/connected/list", authenticateAdmin, DeviceController.getConnectedDevices);

router.post(
  "/broadcast/:orderId",
  authenticateAdmin,
  DeviceController.broadcastOrder
);

export default router;
