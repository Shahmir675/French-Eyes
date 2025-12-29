import { Router } from "express";
import { LoyaltyController } from "../controllers/loyalty.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  paginationQuerySchema,
  redeemRewardSchema,
} from "../validators/loyalty.validator.js";

const router = Router();

router.get("/points", authenticate, LoyaltyController.getPoints);

router.get(
  "/history",
  authenticate,
  validate(paginationQuerySchema, "query"),
  LoyaltyController.getHistory
);

router.get("/rewards", authenticate, LoyaltyController.getRewards);

router.post(
  "/redeem",
  authenticate,
  validate(redeemRewardSchema),
  LoyaltyController.redeemReward
);

export default router;
