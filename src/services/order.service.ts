import { Types } from "mongoose";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Address } from "../models/address.model.js";
import { Product } from "../models/product.model.js";
import { AppError } from "../utils/errors.js";
import type {
  IOrder,
  OrderItem,
  OrderAddress,
  LocalizedString,
  SelectedOption,
  SelectedExtra,
  OrderStatus,
} from "../types/index.js";
import type {
  CreateOrderInput,
  GetOrdersQuery,
  CancelOrderInput,
  ReviewOrderInput,
} from "../validators/order.validator.js";

const TAX_RATE = 0.1;
const DEFAULT_DELIVERY_FEE = 3.0;
const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "confirmed"];

interface OrderItemResponse {
  productId: string;
  productName: LocalizedString;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
  selectedExtras: SelectedExtra[];
  notes?: string;
  itemTotal: number;
}

interface OrderResponse {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  items: OrderItemResponse[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  total: number;
  address?: OrderAddress;
  pickupTime?: string;
  prepTime?: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  review?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
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
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  estimatedDelivery?: string;
  driverLocation?: {
    lat: number;
    lng: number;
  };
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
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      selectedOptions: item.selectedOptions,
      selectedExtras: item.selectedExtras,
      itemTotal: item.itemTotal,
    };

    if (item.notes) {
      response.notes = item.notes;
    }

    return response;
  }

  private static mapOrder(order: IOrder): OrderResponse {
    const response: OrderResponse = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      items: order.items.map(this.mapOrderItem),
      subtotal: order.subtotal,
      tax: order.tax,
      deliveryFee: order.deliveryFee,
      tip: order.tip,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      statusHistory: order.statusHistory.map((h) => {
        const entry: { status: string; timestamp: string; note?: string } = {
          status: h.status,
          timestamp: h.timestamp.toISOString(),
        };
        if (h.note) {
          entry.note = h.note;
        }
        return entry;
      }),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };

    if (order.address) {
      response.address = order.address;
    }

    if (order.pickupTime) {
      response.pickupTime = order.pickupTime.toISOString();
    }

    if (order.prepTime !== undefined) {
      response.prepTime = order.prepTime;
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
        street: address.street,
        city: address.city,
        zipCode: address.zipCode,
        country: address.country,
      };

      if (address.coordinates?.lat && address.coordinates?.lng) {
        orderAddress.coordinates = {
          lat: address.coordinates.lat,
          lng: address.coordinates.lng,
        };
      }

      if (address.deliveryInstructions) {
        orderAddress.deliveryInstructions = address.deliveryInstructions;
      }
    }

    const orderItems: OrderItem[] = cart.items.map((item) => {
      const orderItem: OrderItem = {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.productPrice,
        selectedOptions: item.selectedOptions,
        selectedExtras: item.selectedExtras,
        itemTotal: item.itemTotal,
      };
      if (item.notes) {
        orderItem.notes = item.notes;
      }
      return orderItem;
    });

    const subtotal = Math.round(
      orderItems.reduce((sum, item) => sum + item.itemTotal, 0) * 100
    ) / 100;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const deliveryFee = input.type === "delivery" ? DEFAULT_DELIVERY_FEE : 0;
    const discount = cart.promoDiscount || 0;
    const tip = input.tip || 0;
    const total = Math.round(
      Math.max(0, subtotal + tax + deliveryFee + tip - discount) * 100
    ) / 100;

    const paymentStatus =
      input.paymentMethod === "cash" ? "pending" : "paid";

    const orderData: Partial<IOrder> = {
      orderNumber: this.generateOrderNumber(),
      userId: new Types.ObjectId(userId),
      type: input.type,
      status: "pending",
      items: orderItems,
      subtotal,
      tax,
      deliveryFee,
      tip,
      discount,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      statusHistory: [{ status: "pending", timestamp: new Date() }],
    };

    if (orderAddress) {
      orderData.address = orderAddress;
    }

    if (input.pickupTime) {
      orderData.pickupTime = new Date(input.pickupTime);
    }

    if (input.paymentIntentId) {
      orderData.paymentIntentId = input.paymentIntentId;
    }

    if (input.selectedBonusId) {
      orderData.bonusId = new Types.ObjectId(input.selectedBonusId);
    }

    if (input.notes) {
      orderData.notes = input.notes;
    }

    const order = await Order.create(orderData);

    await Cart.findOneAndUpdate(
      { userId },
      {
        $set: { items: [] },
        $unset: { promoCode: 1, promoDiscount: 1 },
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
      statusHistory: order.statusHistory.map((h) => {
        const entry: { status: string; timestamp: string; note?: string } = {
          status: h.status,
          timestamp: h.timestamp.toISOString(),
        };
        if (h.note) {
          entry.note = h.note;
        }
        return entry;
      }),
    };

    if (order.prepTime) {
      const orderCreatedAt = order.createdAt.getTime();
      const estimatedDeliveryTime = orderCreatedAt + order.prepTime * 60 * 1000;
      response.estimatedDelivery = new Date(estimatedDeliveryTime).toISOString();
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

    const historyEntry: { status: OrderStatus; timestamp: Date; note?: string } = {
      status: "cancelled",
      timestamp: new Date(),
    };

    if (input.reason) {
      historyEntry.note = input.reason;
    }

    order.status = "cancelled";
    order.statusHistory.push(historyEntry);

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

    const completedStatuses: OrderStatus[] = ["completed", "delivered", "picked_up"];
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
        unavailableItems.push(item.productName.en);
      }
    }

    if (itemsToAdd.length === 0) {
      throw AppError.orderItemsUnavailable();
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    for (const item of itemsToAdd) {
      const product = products.find(
        (p) => p._id.toString() === item.productId.toString()
      );

      if (product) {
        const validatedOptions: SelectedOption[] = [];
        for (const oldOption of item.selectedOptions) {
          const productOption = product.options.find((o) => o.name === oldOption.name);
          if (productOption) {
            const choice = productOption.choices.find((c) => c.label === oldOption.choice);
            if (choice) {
              validatedOptions.push({
                name: oldOption.name,
                choice: oldOption.choice,
                price: choice.priceModifier,
              });
            }
          }
        }

        for (const productOption of product.options) {
          if (productOption.required) {
            const hasSelection = validatedOptions.some((o) => o.name === productOption.name);
            if (!hasSelection && productOption.choices.length > 0) {
              const firstChoice = productOption.choices[0];
              if (firstChoice) {
                validatedOptions.push({
                  name: productOption.name,
                  choice: firstChoice.label,
                  price: firstChoice.priceModifier,
                });
              }
            }
          }
        }

        const validatedExtras: SelectedExtra[] = [];
        for (const oldExtra of item.selectedExtras) {
          const productExtra = product.extras.find((e) => e.name === oldExtra.name);
          if (productExtra) {
            validatedExtras.push({
              name: productExtra.name,
              price: productExtra.price,
            });
          }
        }

        const optionsTotal = validatedOptions.reduce((sum, o) => sum + o.price, 0);
        const extrasTotal = validatedExtras.reduce((sum, e) => sum + e.price, 0);
        const itemTotal = Math.round(
          (product.price + optionsTotal + extrasTotal) * item.quantity * 100
        ) / 100;

        const cartItem: {
          _id: Types.ObjectId;
          productId: Types.ObjectId;
          productName: LocalizedString;
          productPrice: number;
          quantity: number;
          selectedOptions: SelectedOption[];
          selectedExtras: SelectedExtra[];
          notes?: string;
          itemTotal: number;
        } = {
          _id: new Types.ObjectId(),
          productId: item.productId,
          productName: product.name,
          productPrice: product.price,
          quantity: item.quantity,
          selectedOptions: validatedOptions,
          selectedExtras: validatedExtras,
          itemTotal,
        };

        if (item.notes) {
          cartItem.notes = item.notes;
        }

        cart.items.push(cartItem);
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
