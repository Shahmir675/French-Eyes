export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_INACTIVE: "USER_INACTIVE",
  ADDRESS_NOT_FOUND: "ADDRESS_NOT_FOUND",
  INVALID_RESET_TOKEN: "INVALID_RESET_TOKEN",
  SOCIAL_AUTH_FAILED: "SOCIAL_AUTH_FAILED",
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  CART_EMPTY: "CART_EMPTY",
  CART_ITEM_NOT_FOUND: "CART_ITEM_NOT_FOUND",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  INVALID_PROMO_CODE: "INVALID_PROMO_CODE",
  PROMO_ALREADY_APPLIED: "PROMO_ALREADY_APPLIED",
  NO_PROMO_APPLIED: "NO_PROMO_APPLIED",
  INVALID_OPTION_SELECTION: "INVALID_OPTION_SELECTION",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_CANNOT_CANCEL: "ORDER_CANNOT_CANCEL",
  ORDER_ALREADY_REVIEWED: "ORDER_ALREADY_REVIEWED",
  ORDER_NOT_COMPLETED: "ORDER_NOT_COMPLETED",
  ORDER_ITEMS_UNAVAILABLE: "ORDER_ITEMS_UNAVAILABLE",
  ZONE_NOT_FOUND: "ZONE_NOT_FOUND",
  ADDRESS_NOT_DELIVERABLE: "ADDRESS_NOT_DELIVERABLE",
  NO_SLOTS_AVAILABLE: "NO_SLOTS_AVAILABLE",
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_ALREADY_PROCESSED: "PAYMENT_ALREADY_PROCESSED",
  INVALID_PAYMENT_AMOUNT: "INVALID_PAYMENT_AMOUNT",
  PAYMENT_PROVIDER_ERROR: "PAYMENT_PROVIDER_ERROR",
  WEBHOOK_SIGNATURE_INVALID: "WEBHOOK_SIGNATURE_INVALID",
  REFUND_FAILED: "REFUND_FAILED",
  INSUFFICIENT_POINTS: "INSUFFICIENT_POINTS",
  REWARD_NOT_FOUND: "REWARD_NOT_FOUND",
  REWARD_UNAVAILABLE: "REWARD_UNAVAILABLE",
  BONUS_NOT_FOUND: "BONUS_NOT_FOUND",
  TICKET_NOT_FOUND: "TICKET_NOT_FOUND",
  TICKET_CLOSED: "TICKET_CLOSED",
  DRIVER_NOT_FOUND: "DRIVER_NOT_FOUND",
  DRIVER_INACTIVE: "DRIVER_INACTIVE",
  ORDER_NOT_AVAILABLE: "ORDER_NOT_AVAILABLE",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Array<{ field: string; message: string }>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 400,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    if (details !== undefined) {
      this.details = details;
    }
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static validation(
    message: string,
    details?: Array<{ field: string; message: string }>
  ): AppError {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }

  static unauthorized(message: string = "Unauthorized"): AppError {
    return new AppError(ErrorCodes.UNAUTHORIZED, message, 401);
  }

  static forbidden(message: string = "Forbidden"): AppError {
    return new AppError(ErrorCodes.FORBIDDEN, message, 403);
  }

  static notFound(message: string = "Resource not found"): AppError {
    return new AppError(ErrorCodes.NOT_FOUND, message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(ErrorCodes.CONFLICT, message, 409);
  }

  static unprocessable(message: string): AppError {
    return new AppError(ErrorCodes.UNPROCESSABLE_ENTITY, message, 422);
  }

  static tooManyRequests(message: string = "Too many requests"): AppError {
    return new AppError(ErrorCodes.TOO_MANY_REQUESTS, message, 429);
  }

  static internal(message: string = "Internal server error"): AppError {
    return new AppError(ErrorCodes.INTERNAL_ERROR, message, 500);
  }

  static invalidCredentials(): AppError {
    return new AppError(
      ErrorCodes.INVALID_CREDENTIALS,
      "Invalid email or password",
      401
    );
  }

  static tokenExpired(): AppError {
    return new AppError(ErrorCodes.TOKEN_EXPIRED, "Token has expired", 401);
  }

  static tokenInvalid(): AppError {
    return new AppError(ErrorCodes.TOKEN_INVALID, "Invalid token", 401);
  }

  static userExists(): AppError {
    return new AppError(
      ErrorCodes.USER_EXISTS,
      "User with this email already exists",
      409
    );
  }

  static userNotFound(): AppError {
    return new AppError(ErrorCodes.USER_NOT_FOUND, "User not found", 404);
  }

  static userInactive(): AppError {
    return new AppError(
      ErrorCodes.USER_INACTIVE,
      "User account is inactive",
      403
    );
  }

  static addressNotFound(): AppError {
    return new AppError(ErrorCodes.ADDRESS_NOT_FOUND, "Address not found", 404);
  }

  static invalidResetToken(): AppError {
    return new AppError(
      ErrorCodes.INVALID_RESET_TOKEN,
      "Invalid or expired password reset token",
      400
    );
  }

  static socialAuthFailed(provider: string): AppError {
    return new AppError(
      ErrorCodes.SOCIAL_AUTH_FAILED,
      `${provider} authentication failed`,
      401
    );
  }

  static categoryNotFound(): AppError {
    return new AppError(ErrorCodes.CATEGORY_NOT_FOUND, "Category not found", 404);
  }

  static productNotFound(): AppError {
    return new AppError(ErrorCodes.PRODUCT_NOT_FOUND, "Product not found", 404);
  }

  static cartEmpty(): AppError {
    return new AppError(ErrorCodes.CART_EMPTY, "Cart is empty", 400);
  }

  static cartItemNotFound(): AppError {
    return new AppError(ErrorCodes.CART_ITEM_NOT_FOUND, "Cart item not found", 404);
  }

  static productUnavailable(): AppError {
    return new AppError(ErrorCodes.PRODUCT_UNAVAILABLE, "Product is currently unavailable", 400);
  }

  static invalidPromoCode(): AppError {
    return new AppError(ErrorCodes.INVALID_PROMO_CODE, "Invalid or expired promo code", 400);
  }

  static promoAlreadyApplied(): AppError {
    return new AppError(ErrorCodes.PROMO_ALREADY_APPLIED, "A promo code is already applied", 400);
  }

  static noPromoApplied(): AppError {
    return new AppError(ErrorCodes.NO_PROMO_APPLIED, "No promo code is applied to this cart", 400);
  }

  static invalidOptionSelection(message: string): AppError {
    return new AppError(ErrorCodes.INVALID_OPTION_SELECTION, message, 400);
  }

  static orderNotFound(): AppError {
    return new AppError(ErrorCodes.ORDER_NOT_FOUND, "Order not found", 404);
  }

  static orderCannotCancel(): AppError {
    return new AppError(
      ErrorCodes.ORDER_CANNOT_CANCEL,
      "Order cannot be cancelled at this stage",
      400
    );
  }

  static orderAlreadyReviewed(): AppError {
    return new AppError(
      ErrorCodes.ORDER_ALREADY_REVIEWED,
      "Order has already been reviewed",
      400
    );
  }

  static orderNotCompleted(): AppError {
    return new AppError(
      ErrorCodes.ORDER_NOT_COMPLETED,
      "Order must be completed before reviewing",
      400
    );
  }

  static orderItemsUnavailable(): AppError {
    return new AppError(
      ErrorCodes.ORDER_ITEMS_UNAVAILABLE,
      "Some items from the original order are no longer available",
      400
    );
  }

  static zoneNotFound(): AppError {
    return new AppError(ErrorCodes.ZONE_NOT_FOUND, "Delivery zone not found", 404);
  }

  static addressNotDeliverable(): AppError {
    return new AppError(
      ErrorCodes.ADDRESS_NOT_DELIVERABLE,
      "This address is outside our delivery area",
      400
    );
  }

  static noSlotsAvailable(): AppError {
    return new AppError(
      ErrorCodes.NO_SLOTS_AVAILABLE,
      "No delivery or pickup slots available for the selected time",
      400
    );
  }

  static paymentNotFound(): AppError {
    return new AppError(ErrorCodes.PAYMENT_NOT_FOUND, "Payment not found", 404);
  }

  static paymentFailed(reason: string): AppError {
    return new AppError(ErrorCodes.PAYMENT_FAILED, reason, 400);
  }

  static paymentAlreadyProcessed(): AppError {
    return new AppError(
      ErrorCodes.PAYMENT_ALREADY_PROCESSED,
      "Payment has already been processed",
      400
    );
  }

  static invalidPaymentAmount(): AppError {
    return new AppError(
      ErrorCodes.INVALID_PAYMENT_AMOUNT,
      "Invalid payment amount",
      400
    );
  }

  static paymentProviderError(message: string): AppError {
    return new AppError(ErrorCodes.PAYMENT_PROVIDER_ERROR, message, 502);
  }

  static webhookSignatureInvalid(): AppError {
    return new AppError(
      ErrorCodes.WEBHOOK_SIGNATURE_INVALID,
      "Invalid webhook signature",
      401
    );
  }

  static refundFailed(reason: string): AppError {
    return new AppError(ErrorCodes.REFUND_FAILED, reason, 400);
  }

  static insufficientPoints(): AppError {
    return new AppError(
      ErrorCodes.INSUFFICIENT_POINTS,
      "Insufficient loyalty points for this reward",
      400
    );
  }

  static rewardNotFound(): AppError {
    return new AppError(ErrorCodes.REWARD_NOT_FOUND, "Reward not found", 404);
  }

  static rewardUnavailable(): AppError {
    return new AppError(
      ErrorCodes.REWARD_UNAVAILABLE,
      "This reward is currently unavailable",
      400
    );
  }

  static bonusNotFound(): AppError {
    return new AppError(ErrorCodes.BONUS_NOT_FOUND, "Bonus item not found", 404);
  }

  static ticketNotFound(): AppError {
    return new AppError(ErrorCodes.TICKET_NOT_FOUND, "Support ticket not found", 404);
  }

  static ticketClosed(): AppError {
    return new AppError(
      ErrorCodes.TICKET_CLOSED,
      "This ticket is closed and cannot receive new messages",
      400
    );
  }

  static driverNotFound(): AppError {
    return new AppError(ErrorCodes.DRIVER_NOT_FOUND, "Driver not found", 404);
  }

  static driverInactive(): AppError {
    return new AppError(
      ErrorCodes.DRIVER_INACTIVE,
      "Driver account is inactive",
      403
    );
  }

  static orderNotAvailable(): AppError {
    return new AppError(
      ErrorCodes.ORDER_NOT_AVAILABLE,
      "This order is no longer available for pickup",
      400
    );
  }

  static invalidStatusTransition(): AppError {
    return new AppError(
      ErrorCodes.INVALID_STATUS_TRANSITION,
      "Invalid status transition for this order",
      400
    );
  }
}
