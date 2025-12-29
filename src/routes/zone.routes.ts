import { Router } from "express";
import { ZoneController } from "../controllers/zone.controller.js";
import { validate } from "../middleware/validate.js";
import {
  validateAddressSchema,
  zoneIdParamSchema,
  checkDeliverableSchema,
  getSlotsQuerySchema,
} from "../validators/zone.validator.js";

const router = Router();

router.get("/", ZoneController.getAllZones);

router.post("/validate", validate(validateAddressSchema), ZoneController.validateAddress);

router.get(
  "/:id/fees",
  validate(zoneIdParamSchema, "params"),
  ZoneController.getZoneFees
);

router.get("/slots", validate(getSlotsQuerySchema, "query"), ZoneController.getSlots);

router.get("/check", validate(checkDeliverableSchema, "query"), ZoneController.checkDeliverable);

export default router;
