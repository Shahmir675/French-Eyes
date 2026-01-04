import { Router } from "express";
import multer from "multer";
import { AdminAuthController } from "../controllers/admin-auth.controller.js";
import { AdminController } from "../controllers/admin.controller.js";
import { authenticateAdmin, requireRole } from "../middleware/admin-auth.js";
import { validate } from "../middleware/validate.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});
import {
  adminLoginSchema,
  adminRefreshTokenSchema,
  listUsersQuerySchema,
  updateUserStatusSchema,
  listDriversQuerySchema,
  createDriverSchema,
  updateDriverSchema,
  assignDriverZonesSchema,
  listOrdersQuerySchema,
  updateOrderStatusSchema,
  assignDriverSchema,
  setPrepTimeSchema,
  processRefundSchema,
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  createProductSchema,
  updateProductSchema,
  updateProductAvailabilitySchema,
  bulkUpdateAvailabilitySchema,
  createZoneSchema,
  updateZoneSchema,
  createBonusSchema,
  updateBonusSchema,
  updateBonusActiveSchema,
  updateLoyaltySettingsSchema,
  createRewardSchema,
  updateRewardSchema,
  listReviewsQuerySchema,
  respondToReviewSchema,
  updateReviewVisibilitySchema,
  statsQuerySchema,
  updateBrandingSchema,
  updateNotificationsSchema,
  updateBusinessSchema,
  updateBusyModeSchema,
  updateTranslationsSchema,
  updateLegalSchema,
  processGdprRequestSchema,
} from "../validators/admin.validator.js";

const router = Router();

router.post("/auth/login", validate(adminLoginSchema), AdminAuthController.login);
router.post("/auth/refresh", validate(adminRefreshTokenSchema), AdminAuthController.refresh);
router.post("/auth/logout", authenticateAdmin, validate(adminRefreshTokenSchema), AdminAuthController.logout);
router.get("/auth/me", authenticateAdmin, AdminAuthController.getMe);

router.get("/users", authenticateAdmin, validate(listUsersQuerySchema, "query"), AdminController.listUsers);
router.get("/users/:id", authenticateAdmin, AdminController.getUserById);
router.patch("/users/:id", authenticateAdmin, AdminController.updateUser);
router.patch("/users/:id/status", authenticateAdmin, validate(updateUserStatusSchema), AdminController.updateUserStatus);
router.get("/users/:id/orders", authenticateAdmin, AdminController.getUserOrders);

router.get("/drivers", authenticateAdmin, validate(listDriversQuerySchema, "query"), AdminController.listDrivers);
router.post("/drivers", authenticateAdmin, validate(createDriverSchema), AdminController.createDriver);
router.get("/drivers/:id", authenticateAdmin, AdminController.getDriverById);
router.patch("/drivers/:id", authenticateAdmin, validate(updateDriverSchema), AdminController.updateDriver);
router.patch("/drivers/:id/status", authenticateAdmin, AdminController.updateDriverStatus);
router.patch("/drivers/:id/zones", authenticateAdmin, validate(assignDriverZonesSchema), AdminController.assignDriverZones);
router.get("/drivers/:id/stats", authenticateAdmin, AdminController.getDriverStats);

router.get("/orders", authenticateAdmin, validate(listOrdersQuerySchema, "query"), AdminController.listOrders);
router.get("/orders/:id", authenticateAdmin, AdminController.getOrderById);
router.patch("/orders/:id/status", authenticateAdmin, validate(updateOrderStatusSchema), AdminController.updateOrderStatus);
router.patch("/orders/:id/assign", authenticateAdmin, validate(assignDriverSchema), AdminController.assignDriver);
router.patch("/orders/:id/prep-time", authenticateAdmin, validate(setPrepTimeSchema), AdminController.setPrepTime);
router.post("/orders/:id/refund", authenticateAdmin, requireRole("super_admin", "admin"), validate(processRefundSchema), AdminController.processRefund);

router.get("/categories", authenticateAdmin, AdminController.listCategories);
router.post("/categories", authenticateAdmin, validate(createCategorySchema), AdminController.createCategory);
router.patch("/categories/:id", authenticateAdmin, validate(updateCategorySchema), AdminController.updateCategory);
router.delete("/categories/:id", authenticateAdmin, AdminController.deleteCategory);
router.patch("/categories/reorder", authenticateAdmin, validate(reorderCategoriesSchema), AdminController.reorderCategories);

router.get("/products", authenticateAdmin, AdminController.listProducts);
router.post("/products", authenticateAdmin, validate(createProductSchema), AdminController.createProduct);
router.get("/products/:id", authenticateAdmin, AdminController.getProductById);
router.patch("/products/:id", authenticateAdmin, validate(updateProductSchema), AdminController.updateProduct);
router.delete("/products/:id", authenticateAdmin, AdminController.deleteProduct);
router.patch("/products/:id/availability", authenticateAdmin, validate(updateProductAvailabilitySchema), AdminController.updateProductAvailability);
router.post("/products/bulk-availability", authenticateAdmin, validate(bulkUpdateAvailabilitySchema), AdminController.bulkUpdateAvailability);
router.post("/products/:id/images", authenticateAdmin, upload.single("image"), AdminController.uploadProductImage);

router.get("/zones", authenticateAdmin, AdminController.listZones);
router.post("/zones", authenticateAdmin, validate(createZoneSchema), AdminController.createZone);
router.get("/zones/:id", authenticateAdmin, AdminController.getZoneById);
router.patch("/zones/:id", authenticateAdmin, validate(updateZoneSchema), AdminController.updateZone);
router.delete("/zones/:id", authenticateAdmin, AdminController.deleteZone);

router.get("/bonuses", authenticateAdmin, AdminController.listBonuses);
router.post("/bonuses", authenticateAdmin, validate(createBonusSchema), AdminController.createBonus);
router.patch("/bonuses/:id", authenticateAdmin, validate(updateBonusSchema), AdminController.updateBonus);
router.delete("/bonuses/:id", authenticateAdmin, AdminController.deleteBonus);
router.patch("/bonuses/:id/active", authenticateAdmin, validate(updateBonusActiveSchema), AdminController.updateBonusActive);

router.get("/loyalty/settings", authenticateAdmin, AdminController.getLoyaltySettings);
router.patch("/loyalty/settings", authenticateAdmin, requireRole("super_admin", "admin"), validate(updateLoyaltySettingsSchema), AdminController.updateLoyaltySettings);
router.get("/loyalty/rewards", authenticateAdmin, AdminController.listRewards);
router.post("/loyalty/rewards", authenticateAdmin, validate(createRewardSchema), AdminController.createReward);
router.patch("/loyalty/rewards/:id", authenticateAdmin, validate(updateRewardSchema), AdminController.updateReward);
router.delete("/loyalty/rewards/:id", authenticateAdmin, AdminController.deleteReward);

router.get("/reviews", authenticateAdmin, validate(listReviewsQuerySchema, "query"), AdminController.listReviews);
router.get("/reviews/:id", authenticateAdmin, AdminController.getReviewById);
router.post("/reviews/:id/respond", authenticateAdmin, validate(respondToReviewSchema), AdminController.respondToReview);
router.patch("/reviews/:id/visibility", authenticateAdmin, validate(updateReviewVisibilitySchema), AdminController.updateReviewVisibility);

router.get("/stats/sales", authenticateAdmin, validate(statsQuerySchema, "query"), AdminController.getSalesStats);
router.get("/stats/orders", authenticateAdmin, validate(statsQuerySchema, "query"), AdminController.getOrderStats);
router.get("/stats/drivers", authenticateAdmin, validate(statsQuerySchema, "query"), AdminController.getDriverStatsReport);
router.get("/stats/zones", authenticateAdmin, validate(statsQuerySchema, "query"), AdminController.getZoneStats);
router.get("/stats/products", authenticateAdmin, validate(statsQuerySchema, "query"), AdminController.getProductStats);
router.get("/tips", authenticateAdmin, validate(statsQuerySchema, "query"), AdminController.getTipsStats);

router.get("/settings", authenticateAdmin, AdminController.getSettings);
router.patch("/settings/branding", authenticateAdmin, requireRole("super_admin", "admin"), validate(updateBrandingSchema), AdminController.updateBranding);
router.patch("/settings/notifications", authenticateAdmin, requireRole("super_admin", "admin"), validate(updateNotificationsSchema), AdminController.updateNotifications);
router.patch("/settings/business", authenticateAdmin, requireRole("super_admin", "admin"), validate(updateBusinessSchema), AdminController.updateBusiness);
router.get("/settings/busy-mode", authenticateAdmin, AdminController.getBusyMode);
router.patch("/settings/busy-mode", authenticateAdmin, validate(updateBusyModeSchema), AdminController.updateBusyMode);

router.get("/translations/:locale", authenticateAdmin, AdminController.getTranslations);
router.patch("/translations/:locale", authenticateAdmin, requireRole("super_admin", "admin"), validate(updateTranslationsSchema), AdminController.updateTranslations);

router.get("/settings/legal", authenticateAdmin, AdminController.getLegal);
router.patch("/settings/legal", authenticateAdmin, requireRole("super_admin", "admin"), validate(updateLegalSchema), AdminController.updateLegal);

router.get("/gdpr/requests", authenticateAdmin, AdminController.listGdprRequests);
router.post("/gdpr/requests/:id/process", authenticateAdmin, requireRole("super_admin", "admin"), validate(processGdprRequestSchema), AdminController.processGdprRequest);

export default router;
