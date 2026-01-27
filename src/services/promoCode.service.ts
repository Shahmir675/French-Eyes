import { PromoCode } from "../models/promoCode.model.js";
import { AppError } from "../utils/errors.js";

interface ValidatePromoResult {
  valid: boolean;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  message: string;
}

export class PromoCodeService {
  static async validate(
    code: string,
    cartTotal: number,
    restaurantId?: string
  ): Promise<ValidatePromoResult> {
    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      active: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
    });

    if (!promo) {
      throw AppError.validation("Invalid or expired promo code");
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw AppError.validation("Promo code usage limit reached");
    }

    if (promo.restaurantId && restaurantId) {
      if (promo.restaurantId.toString() !== restaurantId) {
        throw AppError.validation("Promo code is not valid for this restaurant");
      }
    }

    if (promo.minOrderAmount && cartTotal < promo.minOrderAmount) {
      throw AppError.validation(
        `Minimum order amount of $${promo.minOrderAmount} required`
      );
    }

    let discountAmount = 0;
    if (promo.type === "percentage") {
      discountAmount = (cartTotal * promo.value) / 100;
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount;
      }
    } else {
      discountAmount = promo.value;
    }

    discountAmount = Math.min(discountAmount, cartTotal);

    return {
      valid: true,
      discountType: promo.type,
      discountValue: promo.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
      message:
        promo.type === "percentage"
          ? `${promo.value}% discount applied`
          : `$${promo.value} discount applied`,
    };
  }

  static async apply(code: string): Promise<void> {
    await PromoCode.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  static calculateDiscount(
    type: "percentage" | "fixed",
    value: number,
    subtotal: number,
    maxDiscount?: number
  ): number {
    let discount = 0;

    if (type === "percentage") {
      discount = (subtotal * value) / 100;
      if (maxDiscount && discount > maxDiscount) {
        discount = maxDiscount;
      }
    } else {
      discount = value;
    }

    return Math.min(discount, subtotal);
  }
}
