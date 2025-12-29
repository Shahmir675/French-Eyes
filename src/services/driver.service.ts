import { Types } from "mongoose";
import { Driver } from "../models/driver.model.js";
import { Order } from "../models/order.model.js";
import { SupportTicket } from "../models/supportTicket.model.js";
import { SupportMessage } from "../models/supportMessage.model.js";
import { AppError } from "../utils/errors.js";
import type { DriverStatus, DriverLocation, OrderStatus } from "../types/index.js";

interface LeanDriver {
  _id: Types.ObjectId;
  email: string;
  name: string;
  phone: string;
  assignedZones: Types.ObjectId[];
  status: DriverStatus;
  currentLocation?: DriverLocation;
  totalDeliveries: number;
  totalTips: number;
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanOrder {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  driverId?: Types.ObjectId;
  type: string;
  status: OrderStatus;
  items: Array<{
    productId: Types.ObjectId;
    productName: { en: string; de: string; fr: string };
    quantity: number;
    unitPrice: number;
    itemTotal: number;
  }>;
  subtotal: number;
  total: number;
  tip: number;
  address?: {
    street: string;
    city: string;
    zipCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
    deliveryInstructions?: string;
  };
  zoneId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DriverProfileResponse {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: string;
  currentLocation: DriverLocation | undefined;
  totalDeliveries: number;
  totalTips: number;
  rating: number;
  ratingCount: number;
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | undefined;
  customerPhone: string | undefined;
  address: {
    street: string;
    city: string;
    zipCode: string;
    coordinates: { lat: number; lng: number } | undefined;
    deliveryInstructions: string | undefined;
  } | undefined;
  items: Array<{
    name: string;
    quantity: number;
    total: number;
  }>;
  total: number;
  tip: number;
  notes: string | undefined;
  createdAt: Date;
}

interface OrderListResponse {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TipEntry {
  orderId: string;
  orderNumber: string;
  amount: number;
  createdAt: Date;
}

interface TipsResponse {
  tips: TipEntry[];
  summary: {
    totalTips: number;
    periodTips: number;
    count: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  totalDeliveries: number;
  totalTips: number;
  rating: number;
  ratingCount: number;
  deliveriesThisWeek: number;
  deliveriesThisMonth: number;
  tipsThisWeek: number;
  tipsThisMonth: number;
}

export class DriverService {
  static async getProfile(driverId: string): Promise<DriverProfileResponse> {
    const driver = await Driver.findById(driverId).lean<LeanDriver>();

    if (!driver) {
      throw AppError.driverNotFound();
    }

    return {
      id: driver._id.toString(),
      email: driver.email,
      name: driver.name,
      phone: driver.phone,
      status: driver.status,
      currentLocation: driver.currentLocation,
      totalDeliveries: driver.totalDeliveries,
      totalTips: driver.totalTips,
      rating: driver.rating,
      ratingCount: driver.ratingCount,
    };
  }

  static async updateProfile(
    driverId: string,
    updates: { name: string | undefined; phone: string | undefined }
  ): Promise<DriverProfileResponse> {
    const updateData: Record<string, string> = {};
    if (updates.name) updateData["name"] = updates.name;
    if (updates.phone) updateData["phone"] = updates.phone;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $set: updateData },
      { new: true }
    ).lean<LeanDriver>();

    if (!driver) {
      throw AppError.driverNotFound();
    }

    return {
      id: driver._id.toString(),
      email: driver.email,
      name: driver.name,
      phone: driver.phone,
      status: driver.status,
      currentLocation: driver.currentLocation,
      totalDeliveries: driver.totalDeliveries,
      totalTips: driver.totalTips,
      rating: driver.rating,
      ratingCount: driver.ratingCount,
    };
  }

  static async updateLocation(
    driverId: string,
    location: DriverLocation
  ): Promise<void> {
    const result = await Driver.updateOne(
      { _id: new Types.ObjectId(driverId) },
      { $set: { currentLocation: location } }
    );

    if (result.matchedCount === 0) {
      throw AppError.driverNotFound();
    }
  }

  static async getAssignedOrders(
    driverId: string,
    page: number,
    limit: number
  ): Promise<OrderListResponse> {
    const skip = (page - 1) * limit;

    const query = {
      driverId: new Types.ObjectId(driverId),
      type: "delivery",
      status: { $in: ["ready", "out_for_delivery"] },
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone")
        .lean<(LeanOrder & { userId: { name: string; phone: string } })[]>(),
      Order.countDocuments(query),
    ]);

    return {
      orders: orders.map((order) => this.mapOrderResponse(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getAvailableOrders(
    driverId: string,
    page: number,
    limit: number
  ): Promise<OrderListResponse> {
    const skip = (page - 1) * limit;

    const driver = await Driver.findById(driverId).lean<LeanDriver>();
    if (!driver) {
      throw AppError.driverNotFound();
    }

    const query = {
      type: "delivery",
      status: "ready",
      driverId: { $exists: false },
      zoneId: { $in: driver.assignedZones },
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone")
        .lean<(LeanOrder & { userId: { name: string; phone: string } })[]>(),
      Order.countDocuments(query),
    ]);

    return {
      orders: orders.map((order) => this.mapOrderResponse(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getOrderById(
    driverId: string,
    orderId: string
  ): Promise<OrderResponse> {
    const driver = await Driver.findById(driverId).lean<LeanDriver>();
    if (!driver) {
      throw AppError.driverNotFound();
    }

    const order = await Order.findOne({
      _id: new Types.ObjectId(orderId),
      type: "delivery",
      $or: [
        { driverId: new Types.ObjectId(driverId) },
        {
          driverId: { $exists: false },
          status: "ready",
          zoneId: { $in: driver.assignedZones },
        },
      ],
    })
      .populate("userId", "name phone")
      .lean<LeanOrder & { userId: { name: string; phone: string } }>();

    if (!order) {
      throw AppError.orderNotFound();
    }

    return this.mapOrderResponse(order);
  }

  static async acceptOrder(driverId: string, orderId: string): Promise<OrderResponse> {
    const driver = await Driver.findById(driverId).lean<LeanDriver>();
    if (!driver) {
      throw AppError.driverNotFound();
    }

    if (driver.status === "inactive") {
      throw AppError.driverInactive();
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: new Types.ObjectId(orderId),
        type: "delivery",
        status: "ready",
        driverId: { $exists: false },
        zoneId: { $in: driver.assignedZones },
      },
      {
        $set: {
          driverId: new Types.ObjectId(driverId),
          status: "out_for_delivery",
        },
        $push: {
          statusHistory: {
            status: "out_for_delivery",
            timestamp: new Date(),
            note: `Accepted by driver: ${driver.name}`,
          },
        },
      },
      { new: true }
    )
      .populate("userId", "name phone")
      .lean<LeanOrder & { userId: { name: string; phone: string } }>();

    if (!order) {
      throw AppError.orderNotAvailable();
    }

    await Driver.updateOne(
      { _id: new Types.ObjectId(driverId) },
      { $set: { status: "busy" } }
    );

    return this.mapOrderResponse(order);
  }

  static async updateOrderStatus(
    driverId: string,
    orderId: string,
    status: "picked_up" | "out_for_delivery" | "delivered",
    notes?: string
  ): Promise<OrderResponse> {
    const validTransitions: Record<string, string[]> = {
      ready: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
      picked_up: ["out_for_delivery"],
    };

    const order = await Order.findOne({
      _id: new Types.ObjectId(orderId),
      driverId: new Types.ObjectId(driverId),
    })
      .populate("userId", "name phone")
      .lean<LeanOrder & { userId: { name: string; phone: string } }>();

    if (!order) {
      throw AppError.orderNotFound();
    }

    const allowedStatuses = validTransitions[order.status] || [];
    if (!allowedStatuses.includes(status)) {
      throw AppError.invalidStatusTransition();
    }

    const updateData: Record<string, unknown> = {
      status,
    };

    const historyEntry = {
      status,
      timestamp: new Date(),
      note: notes,
    };

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: updateData,
        $push: { statusHistory: historyEntry },
      },
      { new: true }
    )
      .populate("userId", "name phone")
      .lean<LeanOrder & { userId: { name: string; phone: string } }>();

    if (!updatedOrder) {
      throw AppError.orderNotFound();
    }

    if (status === "delivered") {
      await Driver.updateOne(
        { _id: new Types.ObjectId(driverId) },
        {
          $inc: {
            totalDeliveries: 1,
            totalTips: order.tip || 0,
          },
          $set: { status: "active" },
        }
      );
    }

    return this.mapOrderResponse(updatedOrder);
  }

  static async getDeliveryHistory(
    driverId: string,
    page: number,
    limit: number
  ): Promise<OrderListResponse> {
    const skip = (page - 1) * limit;

    const query = {
      driverId: new Types.ObjectId(driverId),
      status: { $in: ["delivered", "completed"] },
    };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name phone")
        .lean<(LeanOrder & { userId: { name: string; phone: string } })[]>(),
      Order.countDocuments(query),
    ]);

    return {
      orders: orders.map((order) => this.mapOrderResponse(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTips(
    driverId: string,
    page: number,
    limit: number,
    startDate?: string,
    endDate?: string
  ): Promise<TipsResponse> {
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      driverId: new Types.ObjectId(driverId),
      status: { $in: ["delivered", "completed"] },
      tip: { $gt: 0 },
    };

    if (startDate || endDate) {
      query["createdAt"] = {};
      if (startDate) {
        (query["createdAt"] as Record<string, Date>)["$gte"] = new Date(startDate);
      }
      if (endDate) {
        (query["createdAt"] as Record<string, Date>)["$lte"] = new Date(endDate);
      }
    }

    const [orders, total, periodTotal] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("orderNumber tip createdAt")
        .lean<{ _id: Types.ObjectId; orderNumber: string; tip: number; createdAt: Date }[]>(),
      Order.countDocuments(query),
      Order.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$tip" } } },
      ]),
    ]);

    const driver = await Driver.findById(driverId).lean<LeanDriver>();

    return {
      tips: orders.map((order) => ({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        amount: order.tip,
        createdAt: order.createdAt,
      })),
      summary: {
        totalTips: driver?.totalTips || 0,
        periodTips: periodTotal[0]?.total || 0,
        count: total,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getStats(driverId: string): Promise<StatsResponse> {
    const driver = await Driver.findById(driverId).lean<LeanDriver>();
    if (!driver) {
      throw AppError.driverNotFound();
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [weekStats, monthStats] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            driverId: new Types.ObjectId(driverId),
            status: { $in: ["delivered", "completed"] },
            createdAt: { $gte: startOfWeek },
          },
        },
        {
          $group: {
            _id: null,
            deliveries: { $sum: 1 },
            tips: { $sum: "$tip" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            driverId: new Types.ObjectId(driverId),
            status: { $in: ["delivered", "completed"] },
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            deliveries: { $sum: 1 },
            tips: { $sum: "$tip" },
          },
        },
      ]),
    ]);

    return {
      totalDeliveries: driver.totalDeliveries,
      totalTips: driver.totalTips,
      rating: driver.rating,
      ratingCount: driver.ratingCount,
      deliveriesThisWeek: weekStats[0]?.deliveries || 0,
      deliveriesThisMonth: monthStats[0]?.deliveries || 0,
      tipsThisWeek: weekStats[0]?.tips || 0,
      tipsThisMonth: monthStats[0]?.tips || 0,
    };
  }

  static async createSupportTicket(
    driverId: string,
    subject: string,
    messageText: string,
    orderId?: string
  ): Promise<{ ticketId: string; ticketNumber: string }> {
    if (orderId) {
      const order = await Order.findOne({
        _id: new Types.ObjectId(orderId),
        driverId: new Types.ObjectId(driverId),
      });
      if (!order) {
        throw AppError.orderNotFound();
      }
    }

    let ticket;
    let ticketNumber = "";
    let retries = 3;

    while (retries > 0) {
      ticketNumber = await SupportTicket.generateTicketNumber();
      try {
        ticket = await SupportTicket.create({
          userId: new Types.ObjectId(driverId),
          ticketNumber,
          subject,
          category: "delivery",
          orderId: orderId ? new Types.ObjectId(orderId) : undefined,
          status: "open",
        });
        break;
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          continue;
        }
        throw error;
      }
    }

    if (!ticket) {
      throw AppError.internal("Failed to create support ticket");
    }

    try {
      await SupportMessage.create({
        ticketId: ticket._id,
        sender: "user",
        senderId: new Types.ObjectId(driverId),
        message: messageText,
      });
    } catch (error) {
      await SupportTicket.findByIdAndDelete(ticket._id);
      throw error;
    }

    return {
      ticketId: ticket._id.toString(),
      ticketNumber,
    };
  }

  private static mapOrderResponse(
    order: LeanOrder & { userId?: { name: string; phone: string } }
  ): OrderResponse {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.userId?.name,
      customerPhone: order.userId?.phone,
      address: order.address
        ? {
            street: order.address.street,
            city: order.address.city,
            zipCode: order.address.zipCode,
            coordinates: order.address.coordinates,
            deliveryInstructions: order.address.deliveryInstructions,
          }
        : undefined,
      items: order.items.map((item) => ({
        name: item.productName.en,
        quantity: item.quantity,
        total: item.itemTotal,
      })),
      total: order.total,
      tip: order.tip,
      notes: order.notes,
      createdAt: order.createdAt,
    };
  }
}
