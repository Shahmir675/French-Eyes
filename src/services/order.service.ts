import { Types } from "mongoose";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Address } from "../models/address.model.js";
import { Product } from "../models/product.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import { AppError } from "../utils/errors.js";
import type {
  IOrder,
  ICartItem,
  OrderItem,
  OrderAddress,
  SelectedAddOn,
  OrderStatus,
  StatusTimelineEntry,
  DriverDetails,
} from "../types/index.js";
import type {
  CreateOrderInput,
  GetOrdersQuery,
  CancelOrderInput,
  ReviewOrderInput,
} from "../validators/order.validator.js";

const DEFAULT_DELIVERY_FEE = 3.0;
const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "confirmed"];
const POINTS_PER_DOLLAR = 1;

interface OrderItemResponse {
  productId: string;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  selectedAddOns: SelectedAddOn[];
  specialInstructions?: string;
  itemTotal: number;
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  type: string;
  status: string;
  items: OrderItemResponse[];
  subtotal: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  total: number;
  address?: OrderAddress;
  paymentMethod: string;
  paymentStatus: string;
  loyaltyPointsUsed: number;
  loyaltyPointsEarned: number;
  promoCode?: string;
  statusTimeline: Array<{ status: string; timestamp: string }>;
  estimatedDeliveryTime?: string;
  driverDetails?: DriverDetails;
  notes?: string;
  review?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
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

interface TrackingResponse {
  orderId: string;
  orderNumber: string;
  status: string;
  statusTimeline: Array<{ status: string; timestamp: string }>;
  estimatedDeliveryTime?: string;
  driverDetails?: DriverDetails;
}

export class OrderService {
  private static generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FE-${timestamp}${random}`;
  }

  private static mapOrderItem(item: OrderItem): OrderItemResponse {
    const response: OrderItemResponse = {
      productId: item.productId.toString(),
      name: item.name,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      selectedAddOns: item.selectedAddOns,
      itemTotal: item.itemTotal,
    };

    if (item.specialInstructions) {
      response.specialInstructions = item.specialInstructions;
    }

    return response;
  }

  private static mapOrder(order: IOrder): OrderResponse {
    const response: OrderResponse = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId.toString(),
      restaurantName: order.restaurantName,
      type: order.type,
      status: order.status,
      items: order.items.map(this.mapOrderItem),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      tip: order.tip,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      loyaltyPointsUsed: order.loyaltyPointsUsed,
      loyaltyPointsEarned: order.loyaltyPointsEarned,
      statusTimeline: order.statusTimeline.map((s) => ({
        status: s.status,
        timestamp: s.timestamp.toISOString(),
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };

    if (order.address) {
      response.address = order.address;
    }

    if (order.promoCode) {
      response.promoCode = order.promoCode;
    }

    if (order.estimatedDeliveryTime) {
      response.estimatedDeliveryTime = order.estimatedDeliveryTime.toISOString();
    }

    if (order.driverDetails) {
      response.driverDetails = order.driverDetails;
    }

    if (order.notes) {
      response.notes = order.notes;
    }

    if (order.review) {
      response.review = {
        rating: order.review.rating,
        createdAt: order.review.createdAt.toISOString(),
      };
      if (order.review.comment) {
        response.review.comment = order.review.comment;
      }
    }

    return response;
  }

  static async createOrder(userId: string, input: CreateOrderInput): Promise<OrderResponse> {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw AppError.cartEmpty();
    }

    if (!cart.restaurantId) {
      throw AppError.validation("Cart must have a restaurant");
    }

    const restaurant = await Restaurant.findById(cart.restaurantId);
    if (!restaurant) {
      throw AppError.validation("Restaurant not found");
    }

    let orderAddress: OrderAddress | undefined;
    if (input.type === "delivery" && input.addressId) {
      const address = await Address.findOne({
        _id: input.addressId,
        userId,
      });
      if (!address) {
        throw AppError.addressNotFound();
      }

      orderAddress = {
        title: address.title,
        street: address.street,
        state: address.state,
        zipCode: address.zipCode,
        completeAddress: address.completeAddress,
      };

      if (address.coordinates?.lat && address.coordinates?.lng) {
        orderAddress.coordinates = {
          lat: address.coordinates.lat,
          lng: address.coordinates.lng,
        };
      }
    }

    const orderItems: OrderItem[] = cart.items.map((item) => {
      const orderItem: OrderItem = {
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        unitPrice: item.price,
        selectedAddOns: item.selectedAddOns,
        itemTotal: item.itemTotal,
      };
      if (item.specialInstructions) {
        orderItem.specialInstructions = item.specialInstructions;
      }
      return orderItem;
    });

    const subtotal = Math.round(
      orderItems.reduce((sum, item) => sum + item.itemTotal, 0) * 100
    ) / 100;
    const deliveryFee = input.type === "delivery" ? restaurant.deliveryFee : 0;
    const discount = cart.promoDiscount || 0;
    const tip = input.tip || 0;
    const loyaltyPointsToRedeem = input.loyaltyPointsToRedeem || 0;
    const total = Math.round(
      Math.max(0, subtotal + deliveryFee + tip - discount - loyaltyPointsToRedeem) * 100
    ) / 100;

    const loyaltyPointsEarned = Math.floor(total * POINTS_PER_DOLLAR);

    const orderData: Partial<IOrder> = {
      orderNumber: this.generateOrderNumber(),
      userId: new Types.ObjectId(userId),
      restaurantId: cart.restaurantId,
      restaurantName: restaurant.name,
      type: input.type,
      status: "pending",
      items: orderItems,
      subtotal,
      deliveryFee,
      tip,
      discount,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      loyaltyPointsUsed: loyaltyPointsToRedeem,
      loyaltyPointsEarned,
      statusTimeline: [{ status: "pending", timestamp: new Date() }],
    };

    if (orderAddress) {
      orderData.address = orderAddress;
    }

    if (cart.promoCode) {
      orderData.promoCode = cart.promoCode;
    }

    if (input.notes) {
      orderData.notes = input.notes;
    }

    const order = await Order.create(orderData);

    // Clear cart
    await Cart.findOneAndUpdate(
      { userId },
      {
        $set: { items: [] },
        $unset: { promoCode: 1, promoDiscount: 1, restaurantId: 1 },
      }
    );

    return this.mapOrder(order);
  }

  static async getOrders(userId: string, query: GetOrdersQuery): Promise<OrderListResponse> {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { userId };
    if (status) {
      filter["status"] = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return {
      orders: orders.map((order) => this.mapOrder(order)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getOrderById(userId: string, orderId: string): Promise<OrderResponse> {
    const order = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    return this.mapOrder(order);
  }

  static async trackOrder(userId: string, orderId: string): Promise<TrackingResponse> {
    const order = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    const response: TrackingResponse = {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      statusTimeline: order.statusTimeline.map((s) => ({
        status: s.status,
        timestamp: s.timestamp.toISOString(),
      })),
    };

    if (order.estimatedDeliveryTime) {
      response.estimatedDeliveryTime = order.estimatedDeliveryTime.toISOString();
    }

    if (order.driverDetails) {
      response.driverDetails = order.driverDetails;
    }

    return response;
  }

  static async cancelOrder(
    userId: string,
    orderId: string,
    input: CancelOrderInput
  ): Promise<OrderResponse> {
    const order = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw AppError.orderCannotCancel();
    }

    const timelineEntry: StatusTimelineEntry = {
      status: "cancelled",
      timestamp: new Date(),
    };

    order.status = "cancelled";
    order.statusTimeline.push(timelineEntry);

    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    }

    await order.save();

    return this.mapOrder(order);
  }

  static async reviewOrder(
    userId: string,
    orderId: string,
    input: ReviewOrderInput
  ): Promise<OrderResponse> {
    const order = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    const completedStatuses: OrderStatus[] = ["delivered", "picked_up"];
    if (!completedStatuses.includes(order.status)) {
      throw AppError.orderNotCompleted();
    }

    if (order.review) {
      throw AppError.orderAlreadyReviewed();
    }

    order.review = {
      rating: input.rating,
      visible: true,
      createdAt: new Date(),
    };

    if (input.comment) {
      order.review.comment = input.comment;
    }

    await order.save();

    return this.mapOrder(order);
  }

  static async reorder(userId: string, orderId: string): Promise<{ cartId: string; itemsAdded: number; unavailableItems: string[] }> {
    const order = await Order.findOne({
      _id: orderId,
      userId,
    });

    if (!order) {
      throw AppError.orderNotFound();
    }

    const productIds = order.items.map((item) => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      available: true,
    });

    const availableProductIds = new Set(products.map((p) => p._id.toString()));
    const unavailableItems: string[] = [];
    const itemsToAdd: typeof order.items = [];

    for (const item of order.items) {
      if (availableProductIds.has(item.productId.toString())) {
        itemsToAdd.push(item);
      } else {
        unavailableItems.push(item.name);
      }
    }

    if (itemsToAdd.length === 0) {
      throw AppError.orderItemsUnavailable();
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, restaurantId: order.restaurantId, items: [] });
    } else if (cart.restaurantId?.toString() !== order.restaurantId.toString()) {
      // Clear cart if different restaurant
      cart.items = [];
      cart.restaurantId = order.restaurantId;
      delete (cart as unknown as Record<string, unknown>)["promoCode"];
      delete (cart as unknown as Record<string, unknown>)["promoDiscount"];
    }

    for (const item of itemsToAdd) {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString()
      );

      if (product) {
        const validatedAddOns: SelectedAddOn[] = [];
        for (const oldAddOn of item.selectedAddOns) {
          const productAddOn = product.addOns.find((a) => a.name === oldAddOn.name);
          if (productAddOn) {
            validatedAddOns.push({
              name: productAddOn.name,
              price: productAddOn.price,
            });
          }
        }

        const addOnsTotal = validatedAddOns.reduce((sum, a) => sum + a.price, 0);
        const itemTotal = Math.round(
          (product.price + addOnsTotal) * item.quantity * 100
        ) / 100;

        const cartItem: {
          _id: Types.ObjectId;
          productId: Types.ObjectId;
          name: string;
          imageUrl: string;
          price: number;
          quantity: number;
          selectedAddOns: SelectedAddOn[];
          specialInstructions?: string;
          itemTotal: number;
        } = {
          _id: new Types.ObjectId(),
          productId: item.productId,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          quantity: item.quantity,
          selectedAddOns: validatedAddOns,
          itemTotal,
        };

        if (item.specialInstructions) {
          cartItem.specialInstructions = item.specialInstructions;
        }

        cart.items.push(cartItem as ICartItem);
      }
    }

    await cart.save();

    return {
      cartId: cart._id.toString(),
      itemsAdded: itemsToAdd.length,
      unavailableItems,
    };
  }
}
