import { config } from "./index.js";

export const swaggerDocument = {
  openapi: "3.1.0",
  info: {
    title: "French Eyes Food Delivery API",
    version: "1.0.0",
    description: "API for French Eyes food delivery platform - order food, track deliveries, manage your account",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: config.apiUrl,
      description: config.nodeEnv === "production" ? "Production server" : "Development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User profile and addresses" },
    { name: "Categories", description: "Product categories" },
    { name: "Products", description: "Product catalog" },
    { name: "Cart", description: "Shopping cart management" },
    { name: "Orders", description: "Order management" },
    { name: "Zones", description: "Delivery zones and validation" },
    { name: "Payments", description: "Payment processing" },
    { name: "Loyalty", description: "Loyalty points and rewards" },
    { name: "Bonuses", description: "Active bonuses and promotions" },
    { name: "Support", description: "Customer support tickets" },
    { name: "Driver", description: "Driver operations" },
    { name: "Admin", description: "Admin management endpoints" },
    { name: "Devices", description: "POS/Printer device management" },
    { name: "WebSocket", description: "Real-time WebSocket endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 5 },
          totalItems: { type: "integer", example: 100 },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "name", "phone", "gdprConsent"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", minLength: 8, example: "Password123" },
          name: { type: "string", minLength: 2, example: "John Doe" },
          phone: { type: "string", minLength: 6, example: "+49123456789" },
          gdprConsent: { type: "boolean", example: true },
          language: { type: "string", enum: ["de", "en", "fr"], default: "de" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      SocialAuthRequest: {
        type: "object",
        required: ["provider", "token"],
        properties: {
          provider: { type: "string", enum: ["google", "facebook"] },
          token: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          gdprConsent: { type: "boolean" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string" },
          newPassword: { type: "string", minLength: 8 },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/User" },
              tokens: {
                type: "object",
                properties: {
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          language: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2 },
          phone: { type: "string", minLength: 6 },
          language: { type: "string", enum: ["de", "en", "fr"] },
        },
      },
      Address: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          street: { type: "string" },
          city: { type: "string" },
          zipCode: { type: "string" },
          country: { type: "string" },
          coordinates: {
            type: "object",
            properties: {
              lat: { type: "number" },
              lng: { type: "number" },
            },
          },
          isDefault: { type: "boolean" },
          deliveryInstructions: { type: "string" },
        },
      },
      CreateAddressRequest: {
        type: "object",
        required: ["label", "street", "city", "zipCode"],
        properties: {
          label: { type: "string" },
          street: { type: "string" },
          city: { type: "string" },
          zipCode: { type: "string" },
          country: { type: "string", default: "DE" },
          coordinates: {
            type: "object",
            properties: {
              lat: { type: "number" },
              lng: { type: "number" },
            },
          },
          isDefault: { type: "boolean", default: false },
          deliveryInstructions: { type: "string" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          sortOrder: { type: "integer" },
          isActive: { type: "boolean" },
        },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: { type: "number" },
          imageUrl: { type: "string" },
          categoryId: { type: "string" },
          isAvailable: { type: "boolean" },
          isFeatured: { type: "boolean" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                required: { type: "boolean" },
                choices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      price: { type: "number" },
                    },
                  },
                },
              },
            },
          },
          extras: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
              },
            },
          },
        },
      },
      AddCartItemRequest: {
        type: "object",
        required: ["productId"],
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1, default: 1 },
          selectedOptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                choice: { type: "string" },
              },
            },
          },
          selectedExtras: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          },
          notes: { type: "string", maxLength: 500 },
        },
      },
      UpdateCartItemRequest: {
        type: "object",
        properties: {
          quantity: { type: "integer", minimum: 1 },
          selectedOptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                choice: { type: "string" },
              },
            },
          },
          selectedExtras: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
              },
            },
          },
          notes: { type: "string", maxLength: 500 },
        },
      },
      Cart: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/CartItem" },
          },
          subtotal: { type: "number" },
          promoCode: { type: "string" },
          discount: { type: "number" },
        },
      },
      CartItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          product: { $ref: "#/components/schemas/Product" },
          quantity: { type: "integer" },
          selectedOptions: { type: "array", items: { type: "object" } },
          selectedExtras: { type: "array", items: { type: "object" } },
          notes: { type: "string" },
          itemTotal: { type: "number" },
        },
      },
      CalculateCartRequest: {
        type: "object",
        properties: {
          tip: { type: "number", minimum: 0, default: 0 },
          addressId: { type: "string" },
        },
      },
      ApplyPromoRequest: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string" },
        },
      },
      CreateOrderRequest: {
        type: "object",
        required: ["type", "paymentMethod"],
        properties: {
          type: { type: "string", enum: ["delivery", "pickup"] },
          addressId: { type: "string" },
          pickupTime: { type: "string", format: "date-time" },
          paymentMethod: { type: "string", enum: ["cash", "stripe", "paypal"] },
          paymentIntentId: { type: "string" },
          tip: { type: "number", minimum: 0, default: 0 },
          notes: { type: "string", maxLength: 500 },
          selectedBonusId: { type: "string" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "string" },
          orderNumber: { type: "string" },
          userId: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"],
          },
          type: { type: "string", enum: ["delivery", "pickup"] },
          items: { type: "array", items: { type: "object" } },
          subtotal: { type: "number" },
          deliveryFee: { type: "number" },
          tip: { type: "number" },
          discount: { type: "number" },
          total: { type: "number" },
          paymentMethod: { type: "string" },
          paymentStatus: { type: "string" },
          address: { $ref: "#/components/schemas/Address" },
          createdAt: { type: "string", format: "date-time" },
          estimatedDeliveryTime: { type: "string", format: "date-time" },
        },
      },
      CancelOrderRequest: {
        type: "object",
        properties: {
          reason: { type: "string", maxLength: 500 },
        },
      },
      ReviewOrderRequest: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string", maxLength: 1000 },
        },
      },
      Zone: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          zipCodes: { type: "array", items: { type: "string" } },
          deliveryFee: { type: "number" },
          minimumOrder: { type: "number" },
          isActive: { type: "boolean" },
        },
      },
      ValidateAddressRequest: {
        type: "object",
        properties: {
          address: { type: "string" },
          zipCode: { type: "string" },
          coordinates: {
            type: "object",
            properties: {
              lat: { type: "number" },
              lng: { type: "number" },
            },
          },
        },
      },
      CreateStripeIntentRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string" },
          currency: { type: "string", default: "EUR" },
        },
      },
      ConfirmStripePaymentRequest: {
        type: "object",
        required: ["paymentIntentId"],
        properties: {
          paymentIntentId: { type: "string" },
        },
      },
      CreatePayPalOrderRequest: {
        type: "object",
        required: ["orderId"],
        properties: {
          orderId: { type: "string" },
          currency: { type: "string", default: "EUR" },
        },
      },
      CapturePayPalPaymentRequest: {
        type: "object",
        required: ["paypalOrderId"],
        properties: {
          paypalOrderId: { type: "string" },
        },
      },
      LoyaltyPoints: {
        type: "object",
        properties: {
          currentPoints: { type: "integer" },
          lifetimePoints: { type: "integer" },
          tier: { type: "string" },
        },
      },
      LoyaltyReward: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          pointsCost: { type: "integer" },
          type: { type: "string" },
          value: { type: "number" },
        },
      },
      RedeemRewardRequest: {
        type: "object",
        required: ["rewardId"],
        properties: {
          rewardId: { type: "string" },
        },
      },
      Bonus: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          type: { type: "string" },
          value: { type: "number" },
          minimumOrder: { type: "number" },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          isActive: { type: "boolean" },
        },
      },
      CreateTicketRequest: {
        type: "object",
        required: ["subject", "category", "message"],
        properties: {
          subject: { type: "string", minLength: 3, maxLength: 200 },
          category: { type: "string", enum: ["order", "delivery", "payment", "other"] },
          orderId: { type: "string" },
          message: { type: "string", minLength: 10, maxLength: 5000 },
        },
      },
      AddMessageRequest: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", minLength: 1, maxLength: 5000 },
        },
      },
      SupportTicket: {
        type: "object",
        properties: {
          id: { type: "string" },
          ticketNumber: { type: "string" },
          subject: { type: "string" },
          category: { type: "string" },
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
          messages: { type: "array", items: { type: "object" } },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DriverLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      DriverProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          phone: { type: "string" },
          vehicleType: { type: "string" },
          licensePlate: { type: "string" },
          isOnline: { type: "boolean" },
          currentLocation: {
            type: "object",
            properties: {
              lat: { type: "number" },
              lng: { type: "number" },
            },
          },
        },
      },
      UpdateDriverLocationRequest: {
        type: "object",
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
        },
      },
      UpdateOrderStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["picked_up", "out_for_delivery", "delivered"] },
          notes: { type: "string", maxLength: 500 },
        },
      },
      Device: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["thermal_printer", "pos_terminal", "display"] },
          simNumber: { type: "string" },
          audioEnabled: { type: "boolean" },
          token: { type: "string" },
          status: { type: "string", enum: ["active", "inactive", "offline"] },
          lastSeenAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      RegisterDeviceRequest: {
        type: "object",
        required: ["name", "type"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          type: { type: "string", enum: ["thermal_printer", "pos_terminal", "display"] },
          simNumber: { type: "string", maxLength: 50 },
          audioEnabled: { type: "boolean", default: true },
        },
      },
      UpdateDeviceSettingsRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          audioEnabled: { type: "boolean" },
          settings: { type: "object" },
        },
      },
      WebSocketOrderTrackingEvent: {
        type: "object",
        properties: {
          event: { type: "string", enum: ["status_update", "driver_location", "prep_time_update"] },
          data: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string" },
              prepTime: { type: "integer" },
              driverLocation: {
                type: "object",
                properties: { lat: { type: "number" }, lng: { type: "number" } },
              },
              estimatedDelivery: { type: "string", format: "date-time" },
            },
          },
        },
      },
      WebSocketAdminOrderEvent: {
        type: "object",
        properties: {
          event: { type: "string", enum: ["new_order", "order_update", "order_cancelled", "driver_assigned"] },
          data: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              orderNumber: { type: "string" },
              status: { type: "string" },
              type: { type: "string", enum: ["delivery", "pickup"] },
              total: { type: "number" },
              customerName: { type: "string" },
              driverId: { type: "string" },
              driverName: { type: "string" },
            },
          },
        },
      },
      WebSocketDriverOrderEvent: {
        type: "object",
        properties: {
          event: { type: "string", enum: ["order_assigned", "order_cancelled", "order_reassigned"] },
          data: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              orderNumber: { type: "string" },
              customerName: { type: "string" },
              customerPhone: { type: "string" },
              address: { $ref: "#/components/schemas/Address" },
              total: { type: "number" },
              tip: { type: "number" },
            },
          },
        },
      },
      WebSocketSupportChatEvent: {
        type: "object",
        properties: {
          event: { type: "string", enum: ["message", "typing", "read"] },
          data: {
            type: "object",
            properties: {
              ticketId: { type: "string" },
              messageId: { type: "string" },
              sender: { type: "string", enum: ["user", "support"] },
              senderId: { type: "string" },
              message: { type: "string" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "400": { description: "Validation error" },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/social": {
      post: {
        tags: ["Auth"],
        summary: "Social authentication (Google/Facebook)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SocialAuthRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Authentication successful" },
          "400": { description: "Validation error" },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Reset email sent" },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Password reset successful" },
          "400": { description: "Invalid or expired token" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Token refreshed" },
          "401": { description: "Invalid refresh token" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Logged out successfully" },
        },
      },
    },
    "/api/v1/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile",
            content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
          },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete user account",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Account deleted" },
        },
      },
    },
    "/api/v1/users/me/export": {
      get: {
        tags: ["Users"],
        summary: "Export user data (GDPR)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "User data export" },
        },
      },
    },
    "/api/v1/users/me/addresses": {
      get: {
        tags: ["Users"],
        summary: "Get user addresses",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of addresses",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Address" } },
              },
            },
          },
        },
      },
      post: {
        tags: ["Users"],
        summary: "Create new address",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAddressRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Address created" },
        },
      },
    },
    "/api/v1/users/me/addresses/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Update address",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAddressRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Address updated" },
        },
      },
      delete: {
        tags: ["Users"],
        summary: "Delete address",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Address deleted" },
        },
      },
    },
    "/api/v1/users/me/addresses/{id}/default": {
      patch: {
        tags: ["Users"],
        summary: "Set address as default",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Address set as default" },
        },
      },
    },
    "/api/v1/categories": {
      get: {
        tags: ["Categories"],
        summary: "Get all categories",
        responses: {
          "200": {
            description: "List of categories",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Category" } },
              },
            },
          },
        },
      },
    },
    "/api/v1/categories/{id}": {
      get: {
        tags: ["Categories"],
        summary: "Get category by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Category details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Category" } } },
          },
          "404": { description: "Category not found" },
        },
      },
    },
    "/api/v1/products": {
      get: {
        tags: ["Products"],
        summary: "Get all products",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category ID" },
          { name: "search", in: "query", schema: { type: "string" }, description: "Search term" },
          { name: "available", in: "query", schema: { type: "string", enum: ["true", "false"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": {
            description: "List of products",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/products/featured": {
      get: {
        tags: ["Products"],
        summary: "Get featured products",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Featured products list" },
        },
      },
    },
    "/api/v1/products/search": {
      get: {
        tags: ["Products"],
        summary: "Search products",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Search query" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Search results" },
        },
      },
    },
    "/api/v1/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Product details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Product" } } },
          },
          "404": { description: "Product not found" },
        },
      },
    },
    "/api/v1/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get current cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Cart contents",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Cart" } } },
          },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Clear cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Cart cleared" },
        },
      },
    },
    "/api/v1/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddCartItemRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Item added" },
        },
      },
    },
    "/api/v1/cart/items/{id}": {
      patch: {
        tags: ["Cart"],
        summary: "Update cart item",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateCartItemRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Item updated" },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove item from cart",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Item removed" },
        },
      },
    },
    "/api/v1/cart/calculate": {
      post: {
        tags: ["Cart"],
        summary: "Calculate cart totals",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CalculateCartRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Cart calculation" },
        },
      },
    },
    "/api/v1/cart/bonus-eligibility": {
      get: {
        tags: ["Cart"],
        summary: "Check bonus eligibility for cart",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Eligible bonuses" },
        },
      },
    },
    "/api/v1/cart/apply-promo": {
      post: {
        tags: ["Cart"],
        summary: "Apply promo code",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApplyPromoRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Promo applied" },
          "400": { description: "Invalid promo code" },
        },
      },
    },
    "/api/v1/cart/promo": {
      delete: {
        tags: ["Cart"],
        summary: "Remove promo code",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Promo removed" },
        },
      },
    },
    "/api/v1/orders": {
      post: {
        tags: ["Orders"],
        summary: "Create new order",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateOrderRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Order created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
          },
        },
      },
      get: {
        tags: ["Orders"],
        summary: "Get user orders",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["pending", "confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"],
            },
          },
        ],
        responses: {
          "200": { description: "Orders list" },
        },
      },
    },
    "/api/v1/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Order details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } },
          },
          "404": { description: "Order not found" },
        },
      },
    },
    "/api/v1/orders/{id}/track": {
      get: {
        tags: ["Orders"],
        summary: "Track order status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Order tracking info" },
        },
      },
    },
    "/api/v1/orders/{id}/cancel": {
      post: {
        tags: ["Orders"],
        summary: "Cancel order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CancelOrderRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Order cancelled" },
          "400": { description: "Cannot cancel order" },
        },
      },
    },
    "/api/v1/orders/{id}/review": {
      post: {
        tags: ["Orders"],
        summary: "Review order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReviewOrderRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Review submitted" },
        },
      },
    },
    "/api/v1/orders/{id}/reorder": {
      post: {
        tags: ["Orders"],
        summary: "Reorder previous order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Items added to cart" },
        },
      },
    },
    "/api/v1/zones": {
      get: {
        tags: ["Zones"],
        summary: "Get all delivery zones",
        responses: {
          "200": {
            description: "List of zones",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Zone" } },
              },
            },
          },
        },
      },
    },
    "/api/v1/zones/validate": {
      post: {
        tags: ["Zones"],
        summary: "Validate delivery address",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ValidateAddressRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Validation result" },
        },
      },
    },
    "/api/v1/zones/{id}/fees": {
      get: {
        tags: ["Zones"],
        summary: "Get zone delivery fees",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Zone fees" },
        },
      },
    },
    "/api/v1/zones/slots": {
      get: {
        tags: ["Zones"],
        summary: "Get available delivery slots",
        parameters: [
          { name: "date", in: "query", schema: { type: "string", format: "date" }, description: "Date (YYYY-MM-DD)" },
          { name: "type", in: "query", schema: { type: "string", enum: ["delivery", "pickup"] } },
          { name: "zoneId", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Available slots" },
        },
      },
    },
    "/api/v1/zones/check": {
      get: {
        tags: ["Zones"],
        summary: "Check if address is deliverable",
        parameters: [
          { name: "zipCode", in: "query", schema: { type: "string" } },
          { name: "address", in: "query", schema: { type: "string" } },
          { name: "lat", in: "query", schema: { type: "number" } },
          { name: "lng", in: "query", schema: { type: "number" } },
        ],
        responses: {
          "200": { description: "Deliverability check result" },
        },
      },
    },
    "/api/v1/payments/stripe/intent": {
      post: {
        tags: ["Payments"],
        summary: "Create Stripe payment intent",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateStripeIntentRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Payment intent created" },
        },
      },
    },
    "/api/v1/payments/stripe/confirm": {
      post: {
        tags: ["Payments"],
        summary: "Confirm Stripe payment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ConfirmStripePaymentRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Payment confirmed" },
        },
      },
    },
    "/api/v1/payments/stripe/webhook": {
      post: {
        tags: ["Payments"],
        summary: "Stripe webhook endpoint",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Webhook processed" },
        },
      },
    },
    "/api/v1/payments/paypal/create": {
      post: {
        tags: ["Payments"],
        summary: "Create PayPal order",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePayPalOrderRequest" },
            },
          },
        },
        responses: {
          "200": { description: "PayPal order created" },
        },
      },
    },
    "/api/v1/payments/paypal/capture": {
      post: {
        tags: ["Payments"],
        summary: "Capture PayPal payment",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CapturePayPalPaymentRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Payment captured" },
        },
      },
    },
    "/api/v1/payments/paypal/webhook": {
      post: {
        tags: ["Payments"],
        summary: "PayPal webhook endpoint",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          "200": { description: "Webhook processed" },
        },
      },
    },
    "/api/v1/loyalty/points": {
      get: {
        tags: ["Loyalty"],
        summary: "Get user loyalty points",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Loyalty points info",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoyaltyPoints" } } },
          },
        },
      },
    },
    "/api/v1/loyalty/history": {
      get: {
        tags: ["Loyalty"],
        summary: "Get points history",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Points history" },
        },
      },
    },
    "/api/v1/loyalty/rewards": {
      get: {
        tags: ["Loyalty"],
        summary: "Get available rewards",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Available rewards",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/LoyaltyReward" } },
              },
            },
          },
        },
      },
    },
    "/api/v1/loyalty/redeem": {
      post: {
        tags: ["Loyalty"],
        summary: "Redeem reward",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RedeemRewardRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Reward redeemed" },
          "400": { description: "Insufficient points" },
        },
      },
    },
    "/api/v1/bonuses": {
      get: {
        tags: ["Bonuses"],
        summary: "Get all bonuses",
        responses: {
          "200": {
            description: "List of bonuses",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Bonus" } },
              },
            },
          },
        },
      },
    },
    "/api/v1/bonuses/active": {
      get: {
        tags: ["Bonuses"],
        summary: "Get active bonuses",
        responses: {
          "200": { description: "Active bonuses" },
        },
      },
    },
    "/api/v1/support/tickets": {
      post: {
        tags: ["Support"],
        summary: "Create support ticket",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateTicketRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Ticket created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SupportTicket" } } },
          },
        },
      },
      get: {
        tags: ["Support"],
        summary: "Get user tickets",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] } },
        ],
        responses: {
          "200": { description: "User tickets" },
        },
      },
    },
    "/api/v1/support/tickets/{id}": {
      get: {
        tags: ["Support"],
        summary: "Get ticket by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Ticket details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SupportTicket" } } },
          },
          "404": { description: "Ticket not found" },
        },
      },
    },
    "/api/v1/support/tickets/{id}/messages": {
      post: {
        tags: ["Support"],
        summary: "Add message to ticket",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddMessageRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Message added" },
        },
      },
    },
    "/api/v1/driver/auth/login": {
      post: {
        tags: ["Driver"],
        summary: "Driver login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DriverLoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Login successful" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/driver/auth/forgot-password": {
      post: {
        tags: ["Driver"],
        summary: "Driver forgot password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Reset email sent" },
        },
      },
    },
    "/api/v1/driver/auth/refresh": {
      post: {
        tags: ["Driver"],
        summary: "Refresh driver token",
        responses: {
          "200": { description: "Token refreshed" },
        },
      },
    },
    "/api/v1/driver/auth/logout": {
      post: {
        tags: ["Driver"],
        summary: "Driver logout",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Logged out" },
        },
      },
    },
    "/api/v1/driver/profile": {
      get: {
        tags: ["Driver"],
        summary: "Get driver profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Driver profile",
            content: { "application/json": { schema: { $ref: "#/components/schemas/DriverProfile" } } },
          },
        },
      },
      patch: {
        tags: ["Driver"],
        summary: "Update driver profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Profile updated" },
        },
      },
    },
    "/api/v1/driver/location": {
      patch: {
        tags: ["Driver"],
        summary: "Update driver location",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateDriverLocationRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Location updated" },
        },
      },
    },
    "/api/v1/driver/orders": {
      get: {
        tags: ["Driver"],
        summary: "Get available orders for driver",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Available orders" },
        },
      },
    },
    "/api/v1/driver/orders/{id}": {
      get: {
        tags: ["Driver"],
        summary: "Get order details for driver",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Order details" },
        },
      },
    },
    "/api/v1/driver/orders/{id}/accept": {
      patch: {
        tags: ["Driver"],
        summary: "Accept order",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Order accepted" },
        },
      },
    },
    "/api/v1/driver/orders/{id}/status": {
      patch: {
        tags: ["Driver"],
        summary: "Update order status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateOrderStatusRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
        },
      },
    },
    "/api/v1/driver/history": {
      get: {
        tags: ["Driver"],
        summary: "Get delivery history",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Delivery history" },
        },
      },
    },
    "/api/v1/driver/tips": {
      get: {
        tags: ["Driver"],
        summary: "Get tips summary",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "startDate", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "endDate", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: {
          "200": { description: "Tips summary" },
        },
      },
    },
    "/api/v1/driver/stats": {
      get: {
        tags: ["Driver"],
        summary: "Get driver statistics",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Driver stats" },
        },
      },
    },
    "/api/v1/driver/support": {
      post: {
        tags: ["Driver"],
        summary: "Create driver support ticket",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["subject", "message"],
                properties: {
                  subject: { type: "string", minLength: 3, maxLength: 200 },
                  orderId: { type: "string" },
                  message: { type: "string", minLength: 10, maxLength: 5000 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Ticket created" },
        },
      },
    },
    "/api/v1/devices/register": {
      post: {
        tags: ["Devices"],
        summary: "Register new POS/Printer device",
        security: [{ bearerAuth: [] }],
        description: "Requires Admin authentication",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterDeviceRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Device registered",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Device" } } },
          },
          "409": { description: "Device name already exists" },
        },
      },
    },
    "/api/v1/devices": {
      get: {
        tags: ["Devices"],
        summary: "List all registered devices",
        security: [{ bearerAuth: [] }],
        description: "Requires Admin authentication",
        responses: {
          "200": {
            description: "List of devices",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Device" } },
              },
            },
          },
        },
      },
    },
    "/api/v1/devices/{id}": {
      get: {
        tags: ["Devices"],
        summary: "Get device by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Device details" },
          "404": { description: "Device not found" },
        },
      },
      delete: {
        tags: ["Devices"],
        summary: "Unregister device",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Device unregistered" },
          "404": { description: "Device not found" },
        },
      },
    },
    "/api/v1/devices/{id}/settings": {
      patch: {
        tags: ["Devices"],
        summary: "Update device settings",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateDeviceSettingsRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Settings updated" },
        },
      },
    },
    "/api/v1/devices/{id}/test": {
      post: {
        tags: ["Devices"],
        summary: "Send test print to device",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Test print sent" },
        },
      },
    },
    "/api/v1/devices/{id}/regenerate-token": {
      post: {
        tags: ["Devices"],
        summary: "Regenerate device token",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Token regenerated" },
        },
      },
    },
    "/api/v1/devices/{id}/status": {
      patch: {
        tags: ["Devices"],
        summary: "Update device status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["active", "inactive"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
        },
      },
    },
    "/api/v1/devices/connected/list": {
      get: {
        tags: ["Devices"],
        summary: "Get list of currently connected devices",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Connected devices" },
        },
      },
    },
    "/ws/orders/{orderId}/track": {
      get: {
        tags: ["WebSocket"],
        summary: "Customer Order Tracking (WebSocket)",
        description: "WebSocket endpoint for real-time order tracking. Connect with `?token=<user_jwt>`. Receives: status_update, driver_location, prep_time_update events.",
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string" } },
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "User JWT access token" },
        ],
        responses: {
          "101": { description: "Switching Protocols - WebSocket connection established" },
          "401": { description: "Unauthorized - Invalid or missing token" },
        },
      },
    },
    "/ws/admin/orders": {
      get: {
        tags: ["WebSocket"],
        summary: "Admin Live Order Dashboard (WebSocket)",
        description: "WebSocket endpoint for admin real-time order updates. Connect with `?token=<admin_jwt>`. Receives: new_order, order_update, order_cancelled, driver_assigned events.",
        parameters: [
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "Admin JWT access token" },
        ],
        responses: {
          "101": { description: "WebSocket connection established" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/ws/driver/orders": {
      get: {
        tags: ["WebSocket"],
        summary: "Driver Order Notifications (WebSocket)",
        description: "WebSocket endpoint for driver order notifications. Connect with `?token=<driver_jwt>`. Receives: order_assigned, order_cancelled, order_reassigned events.",
        parameters: [
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "Driver JWT access token" },
        ],
        responses: {
          "101": { description: "WebSocket connection established" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/ws/devices/{deviceId}/stream": {
      get: {
        tags: ["WebSocket"],
        summary: "POS/Printer Order Stream (WebSocket)",
        description: "WebSocket endpoint for POS devices to receive orders. Connect with `?token=<device_token>`. Receives: new_order, order_update, order_cancelled events with full order details for printing.",
        parameters: [
          { name: "deviceId", in: "path", required: true, schema: { type: "string" } },
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "Device token (96-char hex)" },
        ],
        responses: {
          "101": { description: "WebSocket connection established" },
          "401": { description: "Invalid device token" },
          "403": { description: "Token/device ID mismatch" },
        },
      },
    },
    "/ws/support/chat/{ticketId}": {
      get: {
        tags: ["WebSocket"],
        summary: "Support Live Chat (WebSocket)",
        description: "WebSocket endpoint for live support chat. Connect with `?token=<user_or_admin_jwt>`. Bidirectional: Send and receive message, typing, read events.",
        parameters: [
          { name: "ticketId", in: "path", required: true, schema: { type: "string" } },
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "User or Admin JWT" },
        ],
        responses: {
          "101": { description: "WebSocket connection established" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};
