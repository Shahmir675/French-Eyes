import { z } from "zod";

const objectIdRegex = /^[a-f\d]{24}$/i;

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const adminRefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const createAdminSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  role: z.enum(["super_admin", "admin", "manager"]).optional().default("admin"),
  permissions: z.array(z.string()).optional().default([]),
});

export const updateAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  role: z.enum(["super_admin", "admin", "manager"]).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const adminIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Invalid admin ID"),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sortBy: z.enum(["createdAt", "name", "email"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listDriversQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "busy"]).optional(),
  zoneId: z.string().regex(objectIdRegex, "Invalid zone ID").optional(),
  sortBy: z.enum(["createdAt", "name", "totalDeliveries", "rating"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createDriverSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  phone: z.string().min(6, "Phone number must be at least 6 characters").trim(),
  assignedZones: z.array(z.string().regex(objectIdRegex, "Invalid zone ID")).optional().default([]),
});

export const updateDriverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim().optional(),
  phone: z.string().min(6, "Phone number must be at least 6 characters").trim().optional(),
  status: z.enum(["active", "inactive", "busy"]).optional(),
});

export const assignDriverZonesSchema = z.object({
  zones: z.array(z.string().regex(objectIdRegex, "Invalid zone ID")),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(["pending", "confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"]).optional(),
  type: z.enum(["delivery", "pickup"]).optional(),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).optional(),
  paymentMethod: z.enum(["cash", "stripe", "paypal"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().regex(objectIdRegex, "Invalid user ID").optional(),
  driverId: z.string().regex(objectIdRegex, "Invalid driver ID").optional(),
  sortBy: z.enum(["createdAt", "total", "status"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"]),
  note: z.string().trim().optional(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().regex(objectIdRegex, "Invalid driver ID"),
});

export const setPrepTimeSchema = z.object({
  prepTime: z.number().int().positive().max(180),
});

export const processRefundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().trim().optional(),
});

export const exportOrdersQuerySchema = z.object({
  format: z.enum(["csv", "excel"]).optional().default("csv"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["pending", "confirmed", "preparing", "ready", "picked_up", "out_for_delivery", "delivered", "completed", "cancelled"]).optional(),
});

export const createCategorySchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    de: z.string().min(1, "German name is required"),
    fr: z.string().min(1, "French name is required"),
  }),
  description: z.object({
    en: z.string().min(1, "English description is required"),
    de: z.string().min(1, "German description is required"),
    fr: z.string().min(1, "French description is required"),
  }),
  image: z.string().url().optional(),
  sortOrder: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export const updateCategorySchema = z.object({
  name: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  description: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  image: z.string().url().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const reorderCategoriesSchema = z.object({
  categories: z.array(z.object({
    id: z.string().regex(objectIdRegex, "Invalid category ID"),
    sortOrder: z.number().int(),
  })),
});

export const createProductSchema = z.object({
  name: z.object({
    en: z.string().min(1, "English name is required"),
    de: z.string().min(1, "German name is required"),
    fr: z.string().min(1, "French name is required"),
  }),
  description: z.object({
    en: z.string().min(1, "English description is required"),
    de: z.string().min(1, "German description is required"),
    fr: z.string().min(1, "French description is required"),
  }),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().regex(objectIdRegex, "Invalid category ID"),
  images: z.array(z.string().url()).optional().default([]),
  options: z.array(z.object({
    name: z.string().min(1),
    required: z.boolean(),
    choices: z.array(z.object({
      label: z.string().min(1),
      priceModifier: z.number(),
    })),
  })).optional().default([]),
  extras: z.array(z.object({
    name: z.string().min(1),
    price: z.number(),
  })).optional().default([]),
  allergens: z.array(z.string()).optional().default([]),
  available: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  preparationTime: z.number().int().nonnegative().optional().default(15),
  sortOrder: z.number().int().optional().default(0),
});

export const updateProductSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  description: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  price: z.number().positive().optional(),
  categoryId: z.string().regex(objectIdRegex, "Invalid category ID").optional(),
  images: z.array(z.string().url()).optional(),
  options: z.array(z.object({
    name: z.string().min(1),
    required: z.boolean(),
    choices: z.array(z.object({
      label: z.string().min(1),
      priceModifier: z.number(),
    })),
  })).optional(),
  extras: z.array(z.object({
    name: z.string().min(1),
    price: z.number(),
  })).optional(),
  allergens: z.array(z.string()).optional(),
  available: z.boolean().optional(),
  featured: z.boolean().optional(),
  preparationTime: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateProductAvailabilitySchema = z.object({
  available: z.boolean(),
});

export const bulkUpdateAvailabilitySchema = z.object({
  products: z.array(z.object({
    id: z.string().regex(objectIdRegex, "Invalid product ID"),
    available: z.boolean(),
  })),
});

export const createZoneSchema = z.object({
  name: z.string().min(1, "Zone name is required").trim(),
  type: z.enum(["zip", "radius"]),
  zipCodes: z.array(z.string()).optional().default([]),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  radiusKm: z.number().positive().optional(),
  deliveryFee: z.number().min(0),
  minimumOrder: z.number().min(0),
  estimatedTime: z.string().min(1),
  active: z.boolean().optional().default(true),
});

export const updateZoneSchema = z.object({
  name: z.string().min(1).trim().optional(),
  type: z.enum(["zip", "radius"]).optional(),
  zipCodes: z.array(z.string()).optional(),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  radiusKm: z.number().positive().optional(),
  deliveryFee: z.number().min(0).optional(),
  minimumOrder: z.number().min(0).optional(),
  estimatedTime: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

export const createBonusSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }),
  description: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }),
  image: z.string().url().optional(),
  minOrderAmount: z.number().positive(),
  active: z.boolean().optional().default(true),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  sortOrder: z.number().int().optional().default(0),
});

export const updateBonusSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  description: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  image: z.string().url().optional(),
  minOrderAmount: z.number().positive().optional(),
  active: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateBonusActiveSchema = z.object({
  active: z.boolean(),
});

export const updateLoyaltySettingsSchema = z.object({
  pointsPerEuro: z.number().positive().optional(),
  bonusThreshold: z.number().positive().optional(),
  pointsExpiryDays: z.number().int().positive().optional(),
});

export const createRewardSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }),
  description: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }),
  pointsCost: z.number().int().positive(),
  type: z.enum(["discount", "free_item", "bonus"]),
  value: z.number().positive(),
  productId: z.string().regex(objectIdRegex, "Invalid product ID").optional(),
  active: z.boolean().optional().default(true),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export const updateRewardSchema = z.object({
  name: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  description: z.object({
    en: z.string().min(1),
    de: z.string().min(1),
    fr: z.string().min(1),
  }).optional(),
  pointsCost: z.number().int().positive().optional(),
  type: z.enum(["discount", "free_item", "bonus"]).optional(),
  value: z.number().positive().optional(),
  productId: z.string().regex(objectIdRegex, "Invalid product ID").optional(),
  active: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  visible: z.coerce.boolean().optional(),
  hasResponse: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "rating"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const respondToReviewSchema = z.object({
  response: z.string().min(1, "Response is required").trim(),
});

export const updateReviewVisibilitySchema = z.object({
  visible: z.boolean(),
});

export const statsQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly", "custom"]).optional().default("daily"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  zoneId: z.string().regex(objectIdRegex, "Invalid zone ID").optional(),
  driverId: z.string().regex(objectIdRegex, "Invalid driver ID").optional(),
  format: z.enum(["json", "csv", "excel"]).optional().default("json"),
});

export const updateSettingsSchema = z.object({
  value: z.record(z.unknown()),
});

export const updateBrandingSchema = z.object({
  logo: z.string().url().optional(),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  appName: z.string().optional(),
});

export const updateNotificationsSchema = z.object({
  templates: z.record(z.object({
    title: z.object({
      en: z.string(),
      de: z.string(),
      fr: z.string(),
    }),
    body: z.object({
      en: z.string(),
      de: z.string(),
      fr: z.string(),
    }),
  })).optional(),
  enabled: z.boolean().optional(),
});

export const updateBusinessSchema = z.object({
  businessHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    friday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string(), closed: z.boolean().optional() }).optional(),
  }).optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const updateBusyModeSchema = z.object({
  enabled: z.boolean(),
  message: z.object({
    en: z.string(),
    de: z.string(),
    fr: z.string(),
  }).optional(),
  estimatedWaitTime: z.number().int().positive().optional(),
});

export const updateTranslationsSchema = z.object({
  translations: z.record(z.string()),
});

export const updateLegalSchema = z.object({
  termsOfService: z.object({
    en: z.string(),
    de: z.string(),
    fr: z.string(),
  }).optional(),
  privacyPolicy: z.object({
    en: z.string(),
    de: z.string(),
    fr: z.string(),
  }).optional(),
});

export const processGdprRequestSchema = z.object({
  notes: z.string().trim().optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminRefreshTokenInput = z.infer<typeof adminRefreshTokenSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListDriversQuery = z.infer<typeof listDriversQuerySchema>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type AssignDriverZonesInput = z.infer<typeof assignDriverZonesSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
export type SetPrepTimeInput = z.infer<typeof setPrepTimeSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
export type ExportOrdersQuery = z.infer<typeof exportOrdersQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductAvailabilityInput = z.infer<typeof updateProductAvailabilitySchema>;
export type BulkUpdateAvailabilityInput = z.infer<typeof bulkUpdateAvailabilitySchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type CreateBonusInput = z.infer<typeof createBonusSchema>;
export type UpdateBonusInput = z.infer<typeof updateBonusSchema>;
export type UpdateBonusActiveInput = z.infer<typeof updateBonusActiveSchema>;
export type UpdateLoyaltySettingsInput = z.infer<typeof updateLoyaltySettingsSchema>;
export type CreateRewardInput = z.infer<typeof createRewardSchema>;
export type UpdateRewardInput = z.infer<typeof updateRewardSchema>;
export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type RespondToReviewInput = z.infer<typeof respondToReviewSchema>;
export type UpdateReviewVisibilityInput = z.infer<typeof updateReviewVisibilitySchema>;
export type StatsQuery = z.infer<typeof statsQuerySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type UpdateBusyModeInput = z.infer<typeof updateBusyModeSchema>;
export type UpdateTranslationsInput = z.infer<typeof updateTranslationsSchema>;
export type UpdateLegalInput = z.infer<typeof updateLegalSchema>;
export type ProcessGdprRequestInput = z.infer<typeof processGdprRequestSchema>;
