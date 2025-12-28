import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  updateProfileSchema,
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(authenticate);

router.get("/me", UserController.getProfile);

router.patch(
  "/me",
  validate(updateProfileSchema),
  UserController.updateProfile
);

router.delete("/me", UserController.deleteAccount);

router.get("/me/export", UserController.exportData);

router.get("/me/addresses", UserController.getAddresses);

router.post(
  "/me/addresses",
  validate(createAddressSchema),
  UserController.createAddress
);

router.patch(
  "/me/addresses/:id",
  validate(addressIdParamSchema, "params"),
  validate(updateAddressSchema),
  UserController.updateAddress
);

router.delete(
  "/me/addresses/:id",
  validate(addressIdParamSchema, "params"),
  UserController.deleteAddress
);

router.patch(
  "/me/addresses/:id/default",
  validate(addressIdParamSchema, "params"),
  UserController.setDefaultAddress
);

export default router;
