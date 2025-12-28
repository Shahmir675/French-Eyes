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
}
