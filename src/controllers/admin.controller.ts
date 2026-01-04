import type { Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service.js";
import { sendSuccess, sendNoContent } from "../utils/response.js";
import type { AuthenticatedAdminRequest } from "../types/index.js";
import { s3Service } from "../services/s3.service.js";
import { AppError } from "../utils/errors.js";
import type {
  ListUsersQuery,
  UpdateUserStatusInput,
  ListDriversQuery,
  CreateDriverInput,
  UpdateDriverInput,
  AssignDriverZonesInput,
  ListOrdersQuery,
  UpdateOrderStatusInput,
  AssignDriverInput,
  SetPrepTimeInput,
  ProcessRefundInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  ReorderCategoriesInput,
  CreateProductInput,
  UpdateProductInput,
  UpdateProductAvailabilityInput,
  BulkUpdateAvailabilityInput,
  CreateZoneInput,
  UpdateZoneInput,
  CreateBonusInput,
  UpdateBonusInput,
  UpdateBonusActiveInput,
  UpdateLoyaltySettingsInput,
  CreateRewardInput,
  UpdateRewardInput,
  ListReviewsQuery,
  RespondToReviewInput,
  UpdateReviewVisibilityInput,
  StatsQuery,
  UpdateBrandingInput,
  UpdateNotificationsInput,
  UpdateBusinessInput,
  UpdateBusyModeInput,
  UpdateTranslationsInput,
  UpdateLegalInput,
  ProcessGdprRequestInput,
} from "../validators/admin.validator.js";

export class AdminController {
  static async listUsers(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListUsersQuery;
      const result = await AdminService.listUsers(query);
      sendSuccess(res, result.users, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getUserById(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.updateUser(id!, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateUserStatusInput;
      const result = await AdminService.updateUserStatus(id!, status);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;
      const result = await AdminService.getUserOrders(id!, page, limit);
      sendSuccess(res, result.orders, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async listDrivers(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListDriversQuery;
      const result = await AdminService.listDrivers(query);
      sendSuccess(res, result.drivers, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async createDriver(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateDriverInput;
      const result = await AdminService.createDriver(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getDriverById(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getDriverById(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateDriver(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateDriverInput;
      const result = await AdminService.updateDriver(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateDriverStatus(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await AdminService.updateDriverStatus(id!, status);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async assignDriverZones(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { zones } = req.body as AssignDriverZonesInput;
      const result = await AdminService.assignDriverZones(id!, zones);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getDriverStats(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getDriverStats(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListOrdersQuery;
      const result = await AdminService.listOrders(query);
      sendSuccess(res, result.orders, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getOrderById(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateOrderStatusInput;
      const result = await AdminService.updateOrderStatus(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async assignDriver(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { driverId } = req.body as AssignDriverInput;
      const result = await AdminService.assignDriver(id!, driverId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async setPrepTime(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { prepTime } = req.body as SetPrepTimeInput;
      const result = await AdminService.setPrepTime(id!, prepTime);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async processRefund(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body as ProcessRefundInput;
      const result = await AdminService.processRefund(id!, amount, reason);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listCategories(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listCategories();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateCategoryInput;
      const result = await AdminService.createCategory(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateCategoryInput;
      const result = await AdminService.updateCategory(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminService.deleteCategory(id!);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async reorderCategories(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categories } = req.body as ReorderCategoriesInput;
      const result = await AdminService.reorderCategories(categories);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listProducts(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.query["categoryId"] as string | undefined;
      const availableStr = req.query["available"] as string | undefined;
      const pageStr = req.query["page"] as string | undefined;
      const limitStr = req.query["limit"] as string | undefined;

      const query: { categoryId?: string; available?: boolean; page: number; limit: number } = {
        page: pageStr ? parseInt(pageStr) : 1,
        limit: limitStr ? parseInt(limitStr) : 50,
      };
      if (categoryId) query.categoryId = categoryId;
      if (availableStr) query.available = availableStr === "true";

      const result = await AdminService.listProducts(query);
      sendSuccess(res, result.products, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateProductInput;
      const result = await AdminService.createProduct(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getProductById(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateProductInput;
      const result = await AdminService.updateProduct(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminService.deleteProduct(id!);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async updateProductAvailability(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { available } = req.body as UpdateProductAvailabilityInput;
      const result = await AdminService.updateProductAvailability(id!, available);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateAvailability(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { products } = req.body as BulkUpdateAvailabilityInput;
      const result = await AdminService.bulkUpdateAvailability(products);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async uploadProductImage(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        throw AppError.validation("No file uploaded");
      }

      // Verify product exists
      await AdminService.getProductById(id!);

      // Upload to S3
      const result = await s3Service.uploadProductImage(
        file.buffer,
        file.mimetype,
        id!,
        file.originalname
      );

      // Update product with new image URL
      const product = await AdminService.updateProduct(id!, {
        $push: { images: result.url }
      } as unknown as UpdateProductInput);

      sendSuccess(res, {
        url: result.url,
        key: result.key,
        product
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async listZones(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listZones();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createZone(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateZoneInput;
      const result = await AdminService.createZone(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getZoneById(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getZoneById(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateZone(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateZoneInput;
      const result = await AdminService.updateZone(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteZone(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminService.deleteZone(id!);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async listBonuses(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listBonuses();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createBonus(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateBonusInput;
      const result = await AdminService.createBonus(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateBonus(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateBonusInput;
      const result = await AdminService.updateBonus(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteBonus(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminService.deleteBonus(id!);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async updateBonusActive(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body as UpdateBonusActiveInput;
      const result = await AdminService.updateBonusActive(id!, active);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getLoyaltySettings(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getLoyaltySettings();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateLoyaltySettings(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const input = req.body as UpdateLoyaltySettingsInput;
      const result = await AdminService.updateLoyaltySettings(adminId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listRewards(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.listRewards();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async createReward(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateRewardInput;
      const result = await AdminService.createReward(input);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateReward(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const input = req.body as UpdateRewardInput;
      const result = await AdminService.updateReward(id!, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteReward(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminService.deleteReward(id!);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  static async listReviews(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListReviewsQuery;
      const result = await AdminService.listReviews(query);
      sendSuccess(res, result.reviews, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getReviewById(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getReviewById(id!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async respondToReview(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.admin!.adminId;
      const { response } = req.body as RespondToReviewInput;
      const result = await AdminService.respondToReview(id!, adminId, response);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateReviewVisibility(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { visible } = req.body as UpdateReviewVisibilityInput;
      const result = await AdminService.updateReviewVisibility(id!, visible);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getSalesStats(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as StatsQuery;
      const result = await AdminService.getSalesStats(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderStats(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as StatsQuery;
      const result = await AdminService.getOrderStats(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getDriverStatsReport(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as StatsQuery;
      const result = await AdminService.getDriverStatsReport(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getZoneStats(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as StatsQuery;
      const result = await AdminService.getZoneStats(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getProductStats(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as StatsQuery;
      const result = await AdminService.getProductStats(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getTipsStats(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as StatsQuery;
      const result = await AdminService.getTipsStats(query);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getSettings(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getSettings();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateBranding(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const input = req.body as UpdateBrandingInput;
      const result = await AdminService.updateSettings(adminId, "branding", input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotifications(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const input = req.body as UpdateNotificationsInput;
      const result = await AdminService.updateSettings(adminId, "notifications", input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateBusiness(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const input = req.body as UpdateBusinessInput;
      const result = await AdminService.updateSettings(adminId, "business", input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getBusyMode(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getBusyMode();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateBusyMode(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const input = req.body as UpdateBusyModeInput;
      const result = await AdminService.updateBusyMode(adminId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getTranslations(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locale } = req.params;
      const result = await AdminService.getTranslations(locale!);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateTranslations(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const { locale } = req.params;
      const { translations } = req.body as UpdateTranslationsInput;
      const result = await AdminService.updateTranslations(adminId, locale!, translations);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getLegal(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminService.getLegal();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async updateLegal(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.admin!.adminId;
      const input = req.body as UpdateLegalInput;
      const result = await AdminService.updateLegal(adminId, input);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async listGdprRequests(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query["page"] as string) || 1;
      const limit = parseInt(req.query["limit"] as string) || 20;
      const result = await AdminService.listGdprRequests(page, limit);
      sendSuccess(res, result.requests, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async processGdprRequest(req: AuthenticatedAdminRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.admin!.adminId;
      const { notes } = req.body as ProcessGdprRequestInput;
      const result = await AdminService.processGdprRequest(id!, adminId, notes);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
