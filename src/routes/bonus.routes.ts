import { Router } from "express";
import { LoyaltyController } from "../controllers/loyalty.controller.js";

const router = Router();

router.get("/", LoyaltyController.getAllBonuses);

router.get("/active", LoyaltyController.getActiveBonuses);

export default router;
