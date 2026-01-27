import { Router } from "express";
import { RestaurantController } from "../controllers/restaurant.controller.js";
import { RestaurantReviewController } from "../controllers/restaurantReview.controller.js";
import { PromoCodeController } from "../controllers/promoCode.controller.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import {
  getRestaurantsQuerySchema,
  getNearbyQuerySchema,
  restaurantIdParamSchema,
  searchRestaurantsQuerySchema,
} from "../validators/restaurant.validator.js";
import {
  createReviewSchema,
  getReviewsQuerySchema,
  reviewRestaurantParamSchema,
} from "../validators/restaurantReview.validator.js";
import { validatePromoSchema } from "../validators/promoCode.validator.js";

const router = Router();

// Get all restaurants
router.get(
  "/",
  validate(getRestaurantsQuerySchema, "query"),
  RestaurantController.getAll
);

// Search restaurants
router.get(
  "/search",
  validate(searchRestaurantsQuerySchema, "query"),
  RestaurantController.search
);

// Get nearby restaurants
router.get(
  "/nearby",
  validate(getNearbyQuerySchema, "query"),
  RestaurantController.getNearby
);

// Validate promo code
router.post(
  "/promo/validate",
  validate(validatePromoSchema),
  PromoCodeController.validate
);

// Get restaurant by ID
router.get(
  "/:id",
  validate(restaurantIdParamSchema, "params"),
  RestaurantController.getById
);

// Get restaurant menu
router.get(
  "/:id/menu",
  validate(restaurantIdParamSchema, "params"),
  RestaurantController.getMenu
);

// Get restaurant reviews
router.get(
  "/:id/reviews",
  validate(reviewRestaurantParamSchema, "params"),
  validate(getReviewsQuerySchema, "query"),
  RestaurantReviewController.getByRestaurant
);

// Create restaurant review (authenticated)
router.post(
  "/:id/reviews",
  authenticate,
  validate(reviewRestaurantParamSchema, "params"),
  validate(createReviewSchema),
  RestaurantReviewController.create
);

export default router;
