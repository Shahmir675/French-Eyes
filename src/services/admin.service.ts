import { Types, FilterQuery } from "mongoose";
import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { Driver } from "../models/driver.model.js";
import { Order } from "../models/order.model.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { DeliveryZone } from "../models/zone.model.js";
import { BonusItem } from "../models/bonus.model.js";
import { LoyaltyReward } from "../models/loyaltyReward.model.js";
import { Settings } from "../models/settings.model.js";
import { GDPRRequest } from "../models/gdprRequest.model.js";
import { Payment } from "../models/payment.model.js";
import { hashPassword } from "../utils/password.js";
import { AppError } from "../utils/errors.js";
import { config } from "../config/index.js";
import type {
  ListUsersQuery,
  ListDriversQuery,
  CreateDriverInput,
  UpdateDriverInput,
  ListOrdersQuery,
  UpdateOrderStatusInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  CreateZoneInput,
  UpdateZoneInput,
  CreateBonusInput,
  UpdateBonusInput,
  CreateRewardInput,
  UpdateRewardInput,
  ListReviewsQuery,
  StatsQuery,
} from "../validators/admin.validator.js";
import type { IUser, IDriver, IOrder, IProduct, ICategory } from "../types/index.js";

const stripe = new Stripe(config.stripe.secretKey);

export class AdminService {
  static async listUsers(query: ListUsersQuery) {
    const { page, limit, search, status, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IUser> = {};
    if (status) filter["status"] = status;
    if (search) {
      filter["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash -passwordResetToken -passwordResetExpires")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getUserById(userId: string) {
    const user = await User.findById(userId)
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .lean();

    if (!user) throw AppError.userNotFound();
    return user;
  }

  static async updateUser(userId: string, data: { name?: string; phone?: string; language?: string }) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true })
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .lean();

    if (!user) throw AppError.userNotFound();
    return user;
  }

  static async updateUserStatus(userId: string, status: "active" | "inactive") {
    const user = await User.findByIdAndUpdate(userId, { status }, { new: true })
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .lean();

    if (!user) throw AppError.userNotFound();
    return user;
  }

  static async getUserOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId }),
    ]);

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async listDrivers(query: ListDriversQuery) {
    const { page, limit, search, status, zoneId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IDriver> = {};
    if (status) filter["status"] = status;
    if (zoneId) filter["assignedZones"] = new Types.ObjectId(zoneId);
    if (search) {
      filter["$or"] = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .select("-passwordHash -passwordResetToken -passwordResetExpires")
        .populate("assignedZones", "name")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Driver.countDocuments(filter),
    ]);

    return {
      drivers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async createDriver(input: CreateDriverInput) {
    const existing = await Driver.findOne({ email: input.email });
    if (existing) throw AppError.conflict("Driver with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const driver = await Driver.create({
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      assignedZones: input.assignedZones.map((id) => new Types.ObjectId(id)),
    });

    return {
      id: driver._id.toString(),
      email: driver.email,
      name: driver.name,
      phone: driver.phone,
      status: driver.status,
      assignedZones: driver.assignedZones,
    };
  }

  static async getDriverById(driverId: string) {
    const driver = await Driver.findById(driverId)
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .populate("assignedZones", "name")
      .lean();

    if (!driver) throw AppError.driverNotFound();
    return driver;
  }

  static async updateDriver(driverId: string, data: UpdateDriverInput) {
    const driver = await Driver.findByIdAndUpdate(driverId, data, { new: true })
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .lean();

    if (!driver) throw AppError.driverNotFound();
    return driver;
  }

  static async updateDriverStatus(driverId: string, status: "active" | "inactive" | "busy") {
    const driver = await Driver.findByIdAndUpdate(driverId, { status }, { new: true })
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .lean();

    if (!driver) throw AppError.driverNotFound();
    return driver;
  }

  static async assignDriverZones(driverId: string, zones: string[]) {
    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { assignedZones: zones.map((id) => new Types.ObjectId(id)) },
      { new: true }
    )
      .select("-passwordHash -passwordResetToken -passwordResetExpires")
      .populate("assignedZones", "name")
      .lean();

    if (!driver) throw AppError.driverNotFound();
    return driver;
  }

  static async getDriverStats(driverId: string) {
    const driver = await Driver.findById(driverId).lean();
    if (!driver) throw AppError.driverNotFound();

    const [completedOrders, totalRevenue, avgDeliveryTime] = await Promise.all([
      Order.countDocuments({ driverId, status: { $in: ["delivered", "completed"] } }),
      Order.aggregate([
        { $match: { driverId: new Types.ObjectId(driverId), status: { $in: ["delivered", "completed"] } } },
        { $group: { _id: null, total: { $sum: "$tip" } } },
      ]),
      Order.aggregate([
        { $match: { driverId: new Types.ObjectId(driverId), status: { $in: ["delivered", "completed"] } } },
        { $project: { deliveryTime: { $subtract: ["$updatedAt", "$createdAt"] } } },
        { $group: { _id: null, avg: { $avg: "$deliveryTime" } } },
      ]),
    ]);

    return {
      totalDeliveries: driver.totalDeliveries,
      totalTips: driver.totalTips,
      rating: driver.rating,
      ratingCount: driver.ratingCount,
      completedOrders,
      totalTipRevenue: totalRevenue[0]?.total || 0,
      avgDeliveryTimeMinutes: avgDeliveryTime[0]?.avg ? Math.round(avgDeliveryTime[0].avg / 60000) : 0,
    };
  }

  static async listOrders(query: ListOrdersQuery) {
    const { page, limit, status, type, paymentStatus, paymentMethod, startDate, endDate, userId, driverId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IOrder> = {};
    if (status) filter["status"] = status;
    if (type) filter["type"] = type;
    if (paymentStatus) filter["paymentStatus"] = paymentStatus;
    if (paymentMethod) filter["paymentMethod"] = paymentMethod;
    if (userId) filter["userId"] = new Types.ObjectId(userId);
    if (driverId) filter["driverId"] = new Types.ObjectId(driverId);
    if (startDate || endDate) {
      filter["createdAt"] = {};
      if (startDate) (filter["createdAt"] as Record<string, Date>)["$gte"] = new Date(startDate);
      if (endDate) (filter["createdAt"] as Record<string, Date>)["$lte"] = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email phone")
        .populate("driverId", "name phone")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async getOrderById(orderId: string) {
    const order = await Order.findById(orderId)
      .populate("userId", "name email phone")
      .populate("driverId", "name phone")
      .populate("zoneId", "name")
      .lean();

    if (!order) throw AppError.orderNotFound();
    return order;
  }

  static async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.orderNotFound();

    order.status = input.status;
    const historyEntry: { status: typeof input.status; timestamp: Date; note?: string } = {
      status: input.status,
      timestamp: new Date(),
    };
    if (input.note) historyEntry.note = input.note;
    order.statusHistory.push(historyEntry);

    await order.save();
    return order.toObject();
  }

  static async assignDriver(orderId: string, driverId: string) {
    const [order, driver] = await Promise.all([
      Order.findById(orderId),
      Driver.findById(driverId),
    ]);

    if (!order) throw AppError.orderNotFound();
    if (!driver) throw AppError.driverNotFound();

    order.driverId = new Types.ObjectId(driverId);
    await order.save();

    return order.toObject();
  }

  static async setPrepTime(orderId: string, prepTime: number) {
    const order = await Order.findByIdAndUpdate(orderId, { prepTime }, { new: true }).lean();
    if (!order) throw AppError.orderNotFound();
    return order;
  }

  static async processRefund(orderId: string, amount?: number, reason?: string) {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.orderNotFound();

    if (order.paymentStatus === "refunded") {
      throw AppError.conflict("Order has already been refunded");
    }

    if (order.paymentMethod === "cash") {
      order.paymentStatus = "refunded";
      await order.save();
      return { success: true, message: "Cash order marked as refunded" };
    }

    const payment = await Payment.findOne({ orderId: order._id, status: "succeeded" });
    if (!payment) throw AppError.paymentNotFound();

    const refundAmount = amount || order.total;

    try {
      if (payment.provider === "stripe") {
        const refundParams: { payment_intent: string; amount: number; reason?: "requested_by_customer" } = {
          payment_intent: payment.providerPaymentId,
          amount: Math.round(refundAmount * 100),
        };
        if (reason) refundParams.reason = "requested_by_customer";
        await stripe.refunds.create(refundParams);
      }

      payment.status = refundAmount >= order.total ? "refunded" : "partially_refunded";
      payment.refundedAmount = refundAmount;
      await payment.save();

      order.paymentStatus = "refunded";
      await order.save();

      return { success: true, refundedAmount: refundAmount };
    } catch (error) {
      throw AppError.refundFailed(error instanceof Error ? error.message : "Refund failed");
    }
  }

  static async listCategories() {
    return Category.find().sort({ sortOrder: 1 }).lean();
  }

  static async createCategory(input: CreateCategoryInput) {
    const category = await Category.create(input);
    return category.toObject();
  }

  static async updateCategory(categoryId: string, input: UpdateCategoryInput) {
    const category = await Category.findByIdAndUpdate(categoryId, input, { new: true }).lean();
    if (!category) throw AppError.categoryNotFound();
    return category;
  }

  static async deleteCategory(categoryId: string) {
    const productsCount = await Product.countDocuments({ categoryId });
    if (productsCount > 0) {
      throw AppError.conflict("Cannot delete category with existing products");
    }

    const result = await Category.findByIdAndDelete(categoryId);
    if (!result) throw AppError.categoryNotFound();
    return { success: true };
  }

  static async reorderCategories(categories: Array<{ id: string; sortOrder: number }>) {
    const bulkOps = categories.map(({ id, sortOrder }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { sortOrder },
      },
    }));

    await Category.bulkWrite(bulkOps);
    return { success: true };
  }

  static async listProducts(query: { categoryId?: string; available?: boolean; page?: number; limit?: number }) {
    const { categoryId, available, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IProduct> = {};
    if (categoryId) filter["categoryId"] = new Types.ObjectId(categoryId);
    if (available !== undefined) filter["available"] = available;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("categoryId", "name")
        .sort({ sortOrder: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async createProduct(input: CreateProductInput) {
    const category = await Category.findById(input.categoryId);
    if (!category) throw AppError.categoryNotFound();

    const product = await Product.create(input);
    return product.toObject();
  }

  static async getProductById(productId: string) {
    const product = await Product.findById(productId).populate("categoryId", "name").lean();
    if (!product) throw AppError.productNotFound();
    return product;
  }

  static async updateProduct(productId: string, input: UpdateProductInput) {
    if (input.categoryId) {
      const category = await Category.findById(input.categoryId);
      if (!category) throw AppError.categoryNotFound();
    }

    const product = await Product.findByIdAndUpdate(productId, input, { new: true }).lean();
    if (!product) throw AppError.productNotFound();
    return product;
  }

  static async deleteProduct(productId: string) {
    const result = await Product.findByIdAndDelete(productId);
    if (!result) throw AppError.productNotFound();
    return { success: true };
  }

  static async updateProductAvailability(productId: string, available: boolean) {
    const product = await Product.findByIdAndUpdate(productId, { available }, { new: true }).lean();
    if (!product) throw AppError.productNotFound();
    return product;
  }

  static async bulkUpdateAvailability(products: Array<{ id: string; available: boolean }>) {
    const bulkOps = products.map(({ id, available }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id) },
        update: { available },
      },
    }));

    await Product.bulkWrite(bulkOps);
    return { success: true, updated: products.length };
  }

  static async listZones() {
    return DeliveryZone.find().sort({ name: 1 }).lean();
  }

  static async createZone(input: CreateZoneInput) {
    const zone = await DeliveryZone.create(input);
    return zone.toObject();
  }

  static async getZoneById(zoneId: string) {
    const zone = await DeliveryZone.findById(zoneId).lean();
    if (!zone) throw AppError.zoneNotFound();
    return zone;
  }

  static async updateZone(zoneId: string, input: UpdateZoneInput) {
    const zone = await DeliveryZone.findByIdAndUpdate(zoneId, input, { new: true }).lean();
    if (!zone) throw AppError.zoneNotFound();
    return zone;
  }

  static async deleteZone(zoneId: string) {
    const driversCount = await Driver.countDocuments({ assignedZones: zoneId });
    if (driversCount > 0) {
      throw AppError.conflict("Cannot delete zone with assigned drivers");
    }

    const result = await DeliveryZone.findByIdAndDelete(zoneId);
    if (!result) throw AppError.zoneNotFound();
    return { success: true };
  }

  static async listBonuses() {
    return BonusItem.find().sort({ sortOrder: 1 }).lean();
  }

  static async createBonus(input: CreateBonusInput) {
    const bonus = await BonusItem.create({
      ...input,
      validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    });
    return bonus.toObject();
  }

  static async updateBonus(bonusId: string, input: UpdateBonusInput) {
    const updateData = {
      ...input,
      validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    };

    const bonus = await BonusItem.findByIdAndUpdate(bonusId, updateData, { new: true }).lean();
    if (!bonus) throw AppError.bonusNotFound();
    return bonus;
  }

  static async deleteBonus(bonusId: string) {
    const result = await BonusItem.findByIdAndDelete(bonusId);
    if (!result) throw AppError.bonusNotFound();
    return { success: true };
  }

  static async updateBonusActive(bonusId: string, active: boolean) {
    const bonus = await BonusItem.findByIdAndUpdate(bonusId, { active }, { new: true }).lean();
    if (!bonus) throw AppError.bonusNotFound();
    return bonus;
  }

  static async getLoyaltySettings() {
    const settings = await Settings.findOne({ key: "loyalty" }).lean();
    return settings?.value || { pointsPerEuro: 1, bonusThreshold: 20.01, pointsExpiryDays: 365 };
  }

  static async updateLoyaltySettings(adminId: string, data: Record<string, unknown>) {
    const settings = await Settings.findOneAndUpdate(
      { key: "loyalty" },
      { value: data, updatedBy: new Types.ObjectId(adminId) },
      { new: true, upsert: true }
    ).lean();
    return settings?.value;
  }

  static async listRewards() {
    return LoyaltyReward.find().sort({ pointsCost: 1 }).lean();
  }

  static async createReward(input: CreateRewardInput) {
    const reward = await LoyaltyReward.create({
      ...input,
      productId: input.productId ? new Types.ObjectId(input.productId) : undefined,
      validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    });
    return reward.toObject();
  }

  static async updateReward(rewardId: string, input: UpdateRewardInput) {
    const updateData = {
      ...input,
      productId: input.productId ? new Types.ObjectId(input.productId) : undefined,
      validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    };

    const reward = await LoyaltyReward.findByIdAndUpdate(rewardId, updateData, { new: true }).lean();
    if (!reward) throw AppError.rewardNotFound();
    return reward;
  }

  static async deleteReward(rewardId: string) {
    const result = await LoyaltyReward.findByIdAndDelete(rewardId);
    if (!result) throw AppError.rewardNotFound();
    return { success: true };
  }

  static async listReviews(query: ListReviewsQuery) {
    const { page, limit, rating, visible, startDate, endDate, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const matchStage: FilterQuery<IOrder> = { review: { $exists: true } };
    if (rating) matchStage["review.rating"] = rating;
    if (visible !== undefined) matchStage["review.visible"] = visible;
    if (startDate || endDate) {
      matchStage["review.createdAt"] = {};
      if (startDate) (matchStage["review.createdAt"] as Record<string, Date>)["$gte"] = new Date(startDate);
      if (endDate) (matchStage["review.createdAt"] as Record<string, Date>)["$lte"] = new Date(endDate);
    }

    const [orders, countResult] = await Promise.all([
      Order.find(matchStage)
        .select("orderNumber userId review createdAt")
        .populate("userId", "name email")
        .sort({ [`review.${sortBy}`]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(matchStage),
    ]);

    const reviews = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      user: order.userId,
      review: order.review,
    }));

    return {
      reviews,
      pagination: { page, limit, total: countResult, pages: Math.ceil(countResult / limit) },
    };
  }

  static async getReviewById(orderId: string) {
    const order = await Order.findById(orderId)
      .select("orderNumber userId review items total createdAt")
      .populate("userId", "name email")
      .lean();

    if (!order || !order.review) throw AppError.reviewNotFound();
    return { order, review: order.review };
  }

  static async respondToReview(orderId: string, adminId: string, response: string) {
    const order = await Order.findById(orderId);
    if (!order || !order.review) throw AppError.reviewNotFound();

    order.review.response = response;
    order.review.respondedAt = new Date();
    order.review.respondedBy = new Types.ObjectId(adminId);
    await order.save();

    return order.review;
  }

  static async updateReviewVisibility(orderId: string, visible: boolean) {
    const order = await Order.findById(orderId);
    if (!order || !order.review) throw AppError.reviewNotFound();

    order.review.visible = visible;
    await order.save();

    return order.review;
  }

  static async getSalesStats(query: StatsQuery) {
    const { period, startDate, endDate, zoneId } = query;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const matchStage: Record<string, unknown> = {
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      status: { $nin: ["cancelled"] },
    };
    if (zoneId) matchStage["zoneId"] = new Types.ObjectId(zoneId);

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          totalTips: { $sum: "$tip" },
          avgOrderValue: { $avg: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          totalTips: { $sum: "$tip" },
          avgOrderValue: { $avg: "$total" },
        },
      },
    ]);

    return { daily: stats, summary: summary[0] || { totalOrders: 0, totalRevenue: 0, totalTips: 0, avgOrderValue: 0 } };
  }

  static async getOrderStats(query: StatsQuery) {
    const { period, startDate, endDate } = query;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const stats = await Order.aggregate([
      { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byType = await Order.aggregate([
      { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const byPaymentMethod = await Order.aggregate([
      { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
    ]);

    return { byStatus: stats, byType, byPaymentMethod };
  }

  static async getDriverStatsReport(query: StatsQuery) {
    const { period, startDate, endDate, driverId } = query;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const matchStage: Record<string, unknown> = {
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      driverId: { $exists: true },
      status: { $in: ["delivered", "completed"] },
    };
    if (driverId) matchStage["driverId"] = new Types.ObjectId(driverId);

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$driverId",
          deliveries: { $sum: 1 },
          totalTips: { $sum: "$tip" },
          avgTip: { $avg: "$tip" },
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "_id",
          foreignField: "_id",
          as: "driver",
        },
      },
      { $unwind: "$driver" },
      {
        $project: {
          driverId: "$_id",
          driverName: "$driver.name",
          deliveries: 1,
          totalTips: 1,
          avgTip: 1,
          rating: "$driver.rating",
        },
      },
      { $sort: { deliveries: -1 } },
    ]);

    return stats;
  }

  static async getZoneStats(query: StatsQuery) {
    const { period, startDate, endDate } = query;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          zoneId: { $exists: true },
          status: { $nin: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: "$zoneId",
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
          avgOrderValue: { $avg: "$total" },
        },
      },
      {
        $lookup: {
          from: "deliveryzones",
          localField: "_id",
          foreignField: "_id",
          as: "zone",
        },
      },
      { $unwind: "$zone" },
      {
        $project: {
          zoneId: "$_id",
          zoneName: "$zone.name",
          orders: 1,
          revenue: 1,
          avgOrderValue: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    return stats;
  }

  static async getProductStats(query: StatsQuery) {
    const { period, startDate, endDate } = query;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          status: { $nin: ["cancelled"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.itemTotal" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 50 },
    ]);

    return stats;
  }

  static async getTipsStats(query: StatsQuery) {
    const { period, startDate, endDate, driverId } = query;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const matchStage: Record<string, unknown> = {
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      tip: { $gt: 0 },
    };
    if (driverId) matchStage["driverId"] = new Types.ObjectId(driverId);

    const stats = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalTips: { $sum: "$tip" },
          tipCount: { $sum: 1 },
          avgTip: { $avg: "$tip" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const summary = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTips: { $sum: "$tip" },
          tipCount: { $sum: 1 },
          avgTip: { $avg: "$tip" },
        },
      },
    ]);

    return { daily: stats, summary: summary[0] || { totalTips: 0, tipCount: 0, avgTip: 0 } };
  }

  static async getSettings() {
    const settings = await Settings.find().lean();
    const result: Record<string, unknown> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    return result;
  }

  static async updateSettings(adminId: string, key: string, value: Record<string, unknown>) {
    const settings = await Settings.findOneAndUpdate(
      { key },
      { value, updatedBy: new Types.ObjectId(adminId) },
      { new: true, upsert: true }
    ).lean();
    return settings;
  }

  static async getBusyMode() {
    const settings = await Settings.findOne({ key: "busy_mode" }).lean();
    return settings?.value || { enabled: false };
  }

  static async updateBusyMode(adminId: string, data: Record<string, unknown>) {
    const settings = await Settings.findOneAndUpdate(
      { key: "busy_mode" },
      { value: data, updatedBy: new Types.ObjectId(adminId) },
      { new: true, upsert: true }
    ).lean();
    return settings?.value;
  }

  static async getTranslations(locale: string) {
    const settings = await Settings.findOne({ key: `translations_${locale}` }).lean();
    return settings?.value || {};
  }

  static async updateTranslations(adminId: string, locale: string, translations: Record<string, string>) {
    const settings = await Settings.findOneAndUpdate(
      { key: `translations_${locale}` },
      { value: translations, updatedBy: new Types.ObjectId(adminId) },
      { new: true, upsert: true }
    ).lean();
    return settings?.value;
  }

  static async getLegal() {
    const settings = await Settings.findOne({ key: "legal" }).lean();
    return settings?.value || {};
  }

  static async updateLegal(adminId: string, data: Record<string, unknown>) {
    const settings = await Settings.findOneAndUpdate(
      { key: "legal" },
      { value: data, updatedBy: new Types.ObjectId(adminId) },
      { new: true, upsert: true }
    ).lean();
    return settings?.value;
  }

  static async listGdprRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      GDPRRequest.find()
        .populate("userId", "name email")
        .populate("processedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      GDPRRequest.countDocuments(),
    ]);

    return {
      requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  static async processGdprRequest(requestId: string, adminId: string, notes?: string) {
    const request = await GDPRRequest.findById(requestId);
    if (!request) throw AppError.gdprRequestNotFound();

    request.status = "processing";
    request.processedBy = new Types.ObjectId(adminId);
    await request.save();

    if (request.type === "deletion") {
      await User.findByIdAndUpdate(request.userId, { status: "inactive" });
    }

    request.status = "completed";
    request.processedAt = new Date();
    if (notes) request.notes = notes;
    await request.save();

    return request.toObject();
  }

  private static getDateRange(period: string, startDate?: string, endDate?: string) {
    const now = new Date();
    let start: Date;
    const end: Date = endDate ? new Date(endDate) : now;

    if (startDate) {
      start = new Date(startDate);
    } else {
      switch (period) {
        case "daily":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "weekly":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "monthly":
          start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { start, end };
  }
}
