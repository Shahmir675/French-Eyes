import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/errors.js";
import type { NotificationType } from "../types/index.js";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  actionUrl?: string;
  orderId?: string;
}

export class NotificationDbService {
  static async create(input: CreateNotificationInput) {
    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      icon: input.icon,
      actionUrl: input.actionUrl,
      orderId: input.orderId,
      read: false,
    });

    return notification;
  }

  static async getAll(
    userId: string,
    options: { page: number; limit: number; read?: boolean | undefined }
  ) {
    const { page, limit, read } = options;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };
    if (typeof read === "boolean") {
      filter["read"] = read;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      throw AppError.notFound("Notification not found");
    }

    return notification;
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { success: true };
  }

  static async delete(userId: string, notificationId: string) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId,
    });

    if (result.deletedCount === 0) {
      throw AppError.notFound("Notification not found");
    }

    return { success: true };
  }

  static async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({ userId, read: false });
    return { unreadCount: count };
  }

  static async createAccountNotification(userId: string) {
    return this.create({
      userId,
      type: "account",
      title: "Account Created!",
      message: "Your account has been created successfully.",
      icon: "A",
    });
  }

  static async createOrderNotification(
    userId: string,
    orderId: string,
    orderNumber: string
  ) {
    return this.create({
      userId,
      type: "order",
      title: "Order Placed Successfully",
      message: `Your order #${orderNumber} has been placed.`,
      icon: "O",
      actionUrl: `/orders/${orderId}`,
      orderId,
    });
  }

  static async createDeliveryNotification(
    userId: string,
    orderId: string,
    orderNumber: string
  ) {
    return this.create({
      userId,
      type: "delivery",
      title: "Order Delivered",
      message: `Your order #${orderNumber} has been delivered. Enjoy!`,
      icon: "D",
      orderId,
    });
  }

  static async createCartNotification(userId: string, itemCount: number) {
    return this.create({
      userId,
      type: "cart",
      title: "Items Added to Cart",
      message: `${itemCount} item(s) added to your cart. Checkout now!`,
      icon: "C",
      actionUrl: "/cart",
    });
  }

  static async createPromoNotification(
    userId: string,
    promoTitle: string,
    promoMessage: string
  ) {
    return this.create({
      userId,
      type: "promo",
      title: promoTitle,
      message: promoMessage,
      icon: "P",
    });
  }
}
