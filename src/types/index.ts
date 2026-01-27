import { Request } from "express";
import { Document, Types } from "mongoose";

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash?: string;
  fullName: string;
  phoneNumber: string;
  profilePicture?: string;
  authProvider: "email" | "google" | "apple";
  providerId?: string;
  loyaltyPoints: number;
  language: "de" | "en" | "fr";
  status: "active" | "inactive";
  emailVerified: boolean;
  notificationsEnabled: boolean;
  gdprConsent: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  createdAt: Date;
}

export interface IAddress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  street: string;
  state: string;
  zipCode: string;
  completeAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Restaurant Types
export interface IRestaurant extends Document {
  _id: Types.ObjectId;
  name: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  deliveryTime: string;
  deliveryFee: number;
  cuisineTypes: string[];
  satisfactionScore: number;
  isOpen: boolean;
  address: string;
  phoneNumber: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// OTP Types
export type OtpType = "registration" | "password_reset";

export interface IOtp extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  email: string;
  code: string;
  type: OtpType;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType = "account" | "order" | "cart" | "delivery" | "promo";

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  read: boolean;
  actionUrl?: string;
  orderId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// PromoCode Types
export type PromoCodeType = "percentage" | "fixed";

export interface IPromoCode extends Document {
  _id: Types.ObjectId;
  code: string;
  type: PromoCodeType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
  restaurantId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Restaurant Review Types
export interface IRestaurantReview extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId?: Types.ObjectId;
  rating: number;
  comment: string;
  userName: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Auth Types
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Product Types
export interface ProductAddOn {
  name: string;
  price: number;
}

export interface ICategory extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  calories?: number;
  servingSize?: string;
  cookingTime: number;
  addOns: ProductAddOn[];
  discount?: number;
  available: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface SelectedAddOn {
  name: string;
  price: number;
}

export interface ICartItem {
  _id: Types.ObjectId;
  productId: Types.ObjectId;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  selectedAddOns: SelectedAddOn[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface ICart extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  restaurantId?: Types.ObjectId;
  items: ICartItem[];
  promoCode?: string;
  promoDiscount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartCalculation {
  subtotal: number;
  deliveryFee: number;
  tip: number;
  discount: number;
  total: number;
}

// Order Types
export type AuthProvider = "email" | "google" | "apple";
export type Language = "de" | "en" | "fr";
export type UserStatus = "active" | "inactive";
export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "cash" | "card" | "apple_pay";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderAddress {
  title: string;
  street: string;
  state: string;
  zipCode: string;
  completeAddress: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface OrderItem {
  productId: Types.ObjectId;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  selectedAddOns: SelectedAddOn[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface StatusTimelineEntry {
  status: OrderStatus;
  timestamp: Date;
}

export interface DriverDetails {
  name: string;
  phone: string;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface IOrderReview {
  rating: number;
  comment?: string;
  response?: string;
  respondedAt?: Date;
  respondedBy?: Types.ObjectId;
  visible: boolean;
  createdAt: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  userId: Types.ObjectId;
  restaurantId: Types.ObjectId;
  restaurantName: string;
  driverId?: Types.ObjectId;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tip: number;
  total: number;
  address?: OrderAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  loyaltyPointsUsed: number;
  loyaltyPointsEarned: number;
  promoCode?: string;
  statusTimeline: StatusTimelineEntry[];
  estimatedDeliveryTime?: Date;
  driverDetails?: DriverDetails;
  notes?: string;
  review?: IOrderReview;
  createdAt: Date;
  updatedAt: Date;
}

// Zone Types
export type ZoneType = "zip" | "radius";

export interface ZoneCoordinates {
  lat: number;
  lng: number;
}

export interface IDeliveryZone extends Document {
  _id: Types.ObjectId;
  name: string;
  type: ZoneType;
  zipCodes: string[];
  center?: ZoneCoordinates;
  radiusKm?: number;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export type PaymentProvider = "stripe" | "paypal";
export type PaymentTransactionStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentProvider;
  providerPaymentId: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  clientSecret?: string;
  metadata?: Record<string, string>;
  refundedAmount?: number;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Loyalty Types
export type LoyaltyTransactionType = "earn" | "redeem" | "expire" | "adjust";

export interface ILoyaltyTransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: LoyaltyTransactionType;
  points: number;
  orderId?: Types.ObjectId;
  rewardId?: Types.ObjectId;
  description: string;
  createdAt: Date;
}

export type LoyaltyRewardType = "discount" | "free_item" | "bonus";

export interface ILoyaltyReward extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  pointsCost: number;
  type: LoyaltyRewardType;
  value: number;
  productId?: Types.ObjectId;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBonusItem extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  image?: string;
  minOrderAmount: number;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Support Types
export type SupportTicketCategory = "order" | "delivery" | "payment" | "other";
export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type MessageSender = "user" | "support";

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ticketNumber: string;
  subject: string;
  category: SupportTicketCategory;
  orderId?: Types.ObjectId;
  status: SupportTicketStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportMessage extends Document {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId;
  sender: MessageSender;
  senderId: Types.ObjectId;
  message: string;
  createdAt: Date;
}

// Driver Types
export type DriverStatus = "active" | "inactive" | "busy";

export interface DriverLocation {
  lat: number;
  lng: number;
}

export interface IDriver extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  profilePicture?: string;
  assignedZones: Types.ObjectId[];
  status: DriverStatus;
  currentLocation?: DriverLocation;
  totalDeliveries: number;
  totalTips: number;
  rating: number;
  ratingCount: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDriverSession extends Document {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  createdAt: Date;
}

export interface DriverTokenPayload {
  driverId: string;
  email: string;
  type: "access" | "refresh";
}

export interface AuthenticatedDriverRequest extends Request {
  driver?: {
    driverId: string;
    email: string;
  };
}

// Admin Types
export type AdminRole = "super_admin" | "admin" | "manager";
export type AdminStatus = "active" | "inactive";

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  permissions: string[];
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminSession extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  createdAt: Date;
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  type: "access" | "refresh";
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    role: AdminRole;
  };
}

// Settings Types
export interface ISettings extends Document {
  _id: Types.ObjectId;
  key: string;
  value: Record<string, unknown>;
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

export interface IGDPRRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: "export" | "deletion";
  status: "pending" | "processing" | "completed" | "failed";
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Device Types
export type DeviceType = "thermal_printer" | "pos_terminal" | "display";
export type DeviceStatus = "active" | "inactive" | "offline";

export interface IDevice extends Document {
  _id: Types.ObjectId;
  name: string;
  type: DeviceType;
  simNumber?: string;
  audioEnabled: boolean;
  token: string;
  status: DeviceStatus;
  lastSeenAt?: Date;
  settings: Record<string, unknown>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedDeviceRequest extends Request {
  device?: {
    deviceId: string;
    name: string;
    type: DeviceType;
  };
}

export interface DeviceTokenPayload {
  deviceId: string;
  type: DeviceType;
}

// WebSocket Event Types
export interface OrderPrintPayload {
  event: "new_order" | "order_update" | "order_cancelled";
  order: {
    id: string;
    orderNumber: string;
    customer: { name: string; phone: string };
    type: OrderType;
    items: Array<{
      name: string;
      quantity: number;
      addOns: string[];
      notes?: string;
    }>;
    notes?: string;
    bonus?: { name: string };
    total: number;
    createdAt: string;
  };
}

export interface CustomerOrderTrackingEvent {
  event: "status_update" | "driver_location" | "prep_time_update";
  data: {
    orderId: string;
    status?: OrderStatus;
    prepTime?: number;
    driverLocation?: { lat: number; lng: number };
    estimatedDelivery?: string;
  };
}

export interface AdminOrderEvent {
  event: "new_order" | "order_update" | "order_cancelled" | "driver_assigned";
  data: {
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    type: OrderType;
    total: number;
    customerName: string;
    driverId?: string;
    driverName?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface DriverOrderEvent {
  event: "order_assigned" | "order_cancelled" | "order_reassigned";
  data: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    address?: OrderAddress;
    total: number;
    tip: number;
    notes?: string;
  };
}

export interface SupportChatEvent {
  event: "message" | "typing" | "read";
  data: {
    ticketId: string;
    messageId?: string;
    sender: MessageSender;
    senderId: string;
    message?: string;
    timestamp: string;
  };
}

export type WSClientType = "customer" | "admin" | "driver" | "device" | "support";

// Time Slot Types
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  available: boolean;
  type: "delivery" | "pickup";
}
