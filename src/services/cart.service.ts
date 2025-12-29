import { Types } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { AppError } from "../utils/errors.js";
import type {
  ICart,
  ICartItem,
  LocalizedString,
  SelectedOption,
  SelectedExtra,
  CartCalculation,
} from "../types/index.js";
import type {
  AddCartItemInput,
  UpdateCartItemInput,
  CalculateCartInput,
} from "../validators/cart.validator.js";

const BONUS_THRESHOLD = 20.01;
const TAX_RATE = 0.1;
const DEFAULT_DELIVERY_FEE = 3.0;

interface CartItemResponse {
  id: string;
  productId: string;
  productName: LocalizedString;
  productPrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  selectedExtras: SelectedExtra[];
  notes?: string;
  itemTotal: number;
}

interface CartResponse {
  id: string;
  items: CartItemResponse[];
  promoCode?: string;
  promoDiscount?: number;
  itemCount: number;
  subtotal: number;
}

export class CartService {
  private static mapCartItem(item: ICartItem): CartItemResponse {
    const response: CartItemResponse = {
      id: item._id.toString(),
      productId: item.productId.toString(),
      productName: item.productName,
      productPrice: item.productPrice,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions,
      selectedExtras: item.selectedExtras,
      itemTotal: item.itemTotal,
    };

    if (item.notes) {
      response.notes = item.notes;
    }

    return response;
  }

  private static mapCart(cart: ICart): CartResponse {
    const items = cart.items.map(this.mapCartItem);
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.itemTotal, 0) * 100) / 100;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const response: CartResponse = {
      id: cart._id.toString(),
      items,
      itemCount,
      subtotal,
    };

    if (cart.promoCode) {
      response.promoCode = cart.promoCode;
    }

    if (cart.promoDiscount) {
      response.promoDiscount = cart.promoDiscount;
    }

    return response;
  }

  private static calculateItemTotal(
    basePrice: number,
    quantity: number,
    selectedOptions: SelectedOption[],
    selectedExtras: SelectedExtra[]
  ): number {
    const optionsTotal = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
    const extrasTotal = selectedExtras.reduce((sum, ext) => sum + ext.price, 0);
    return Math.round((basePrice + optionsTotal + extrasTotal) * quantity * 100) / 100;
  }

  static async getCart(userId: string): Promise<CartResponse> {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    return this.mapCart(cart);
  }

  static async addItem(userId: string, input: AddCartItemInput): Promise<CartResponse> {
    const { productId, quantity, selectedOptions, selectedExtras, notes } = input;

    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.productNotFound();
    }

    if (!product.available) {
      throw AppError.productUnavailable();
    }

    const validatedOptions: SelectedOption[] = [];
    for (const selected of selectedOptions) {
      const productOption = product.options.find((opt) => opt.name === selected.name);
      if (!productOption) {
        throw AppError.invalidOptionSelection(`Unknown option: ${selected.name}`);
      }

      const choice = productOption.choices.find((c) => c.label === selected.choice);
      if (!choice) {
        throw AppError.invalidOptionSelection(
          `Invalid choice '${selected.choice}' for option '${selected.name}'`
        );
      }

      validatedOptions.push({
        name: selected.name,
        choice: selected.choice,
        price: choice.priceModifier,
      });
    }

    for (const productOption of product.options) {
      if (productOption.required) {
        const hasSelection = validatedOptions.some((opt) => opt.name === productOption.name);
        if (!hasSelection) {
          throw AppError.invalidOptionSelection(
            `Required option '${productOption.name}' must be selected`
          );
        }
      }
    }

    const validatedExtras: SelectedExtra[] = [];
    for (const selected of selectedExtras) {
      const productExtra = product.extras.find((ext) => ext.name === selected.name);
      if (!productExtra) {
        throw AppError.invalidOptionSelection(`Unknown extra: ${selected.name}`);
      }

      validatedExtras.push({
        name: selected.name,
        price: productExtra.price,
      });
    }

    const itemTotal = this.calculateItemTotal(
      product.price,
      quantity,
      validatedOptions,
      validatedExtras
    );

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const newItem = {
      _id: new Types.ObjectId(),
      productId: new Types.ObjectId(productId),
      productName: product.name,
      productPrice: product.price,
      quantity,
      selectedOptions: validatedOptions,
      selectedExtras: validatedExtras,
      notes,
      itemTotal,
    };

    cart.items.push(newItem as ICartItem);
    await cart.save();

    return this.mapCart(cart);
  }

  static async updateItem(
    userId: string,
    itemId: string,
    input: UpdateCartItemInput
  ): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.cartItemNotFound();
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      throw AppError.cartItemNotFound();
    }

    const item = cart.items[itemIndex];
    if (!item) {
      throw AppError.cartItemNotFound();
    }

    if (input.quantity !== undefined) {
      item.quantity = input.quantity;
    }

    if (input.selectedOptions !== undefined) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw AppError.productNotFound();
      }

      const validatedOptions: SelectedOption[] = [];
      for (const selected of input.selectedOptions) {
        const productOption = product.options.find((opt) => opt.name === selected.name);
        if (!productOption) {
          throw AppError.invalidOptionSelection(`Unknown option: ${selected.name}`);
        }

        const choice = productOption.choices.find((c) => c.label === selected.choice);
        if (!choice) {
          throw AppError.invalidOptionSelection(
            `Invalid choice '${selected.choice}' for option '${selected.name}'`
          );
        }

        validatedOptions.push({
          name: selected.name,
          choice: selected.choice,
          price: choice.priceModifier,
        });
      }

      for (const productOption of product.options) {
        if (productOption.required) {
          const hasSelection = validatedOptions.some((opt) => opt.name === productOption.name);
          if (!hasSelection) {
            throw AppError.invalidOptionSelection(
              `Required option '${productOption.name}' must be selected`
            );
          }
        }
      }

      item.selectedOptions = validatedOptions;
    }

    if (input.selectedExtras !== undefined) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw AppError.productNotFound();
      }

      const validatedExtras: SelectedExtra[] = [];
      for (const selected of input.selectedExtras) {
        const productExtra = product.extras.find((ext) => ext.name === selected.name);
        if (!productExtra) {
          throw AppError.invalidOptionSelection(`Unknown extra: ${selected.name}`);
        }

        validatedExtras.push({
          name: selected.name,
          price: productExtra.price,
        });
      }

      item.selectedExtras = validatedExtras;
    }

    if (input.notes !== undefined) {
      item.notes = input.notes;
    }

    item.itemTotal = this.calculateItemTotal(
      item.productPrice,
      item.quantity,
      item.selectedOptions,
      item.selectedExtras
    );

    await cart.save();

    return this.mapCart(cart);
  }

  static async removeItem(userId: string, itemId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.cartItemNotFound();
    }

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) {
      throw AppError.cartItemNotFound();
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    return this.mapCart(cart);
  }

  static async clearCart(userId: string): Promise<{ message: string }> {
    await Cart.findOneAndUpdate(
      { userId },
      {
        $set: { items: [] },
        $unset: { promoCode: 1, promoDiscount: 1 },
      }
    );

    return { message: "Cart cleared successfully" };
  }

  static async calculate(userId: string, input: CalculateCartInput): Promise<CartCalculation> {
    const { tip, addressId } = input;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        deliveryFee: 0,
        tip: tip,
        discount: 0,
        total: tip,
        bonusEligible: false,
        bonusThreshold: BONUS_THRESHOLD,
        amountToBonus: BONUS_THRESHOLD,
      };
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.itemTotal, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;

    let deliveryFee = DEFAULT_DELIVERY_FEE;
    if (addressId) {
      deliveryFee = DEFAULT_DELIVERY_FEE;
    }

    const discount = cart.promoDiscount || 0;

    const total = Math.max(0, subtotal + tax + deliveryFee + tip - discount);
    const bonusEligible = subtotal >= BONUS_THRESHOLD;
    const amountToBonus = bonusEligible ? 0 : Math.max(0, BONUS_THRESHOLD - subtotal);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax,
      deliveryFee,
      tip,
      discount,
      total: Math.round(total * 100) / 100,
      bonusEligible,
      bonusThreshold: BONUS_THRESHOLD,
      amountToBonus: Math.round(amountToBonus * 100) / 100,
    };
  }

  static async getBonusEligibility(
    userId: string
  ): Promise<{ eligible: boolean; threshold: number; currentTotal: number; amountNeeded: number }> {
    const cart = await Cart.findOne({ userId });
    const currentTotal = cart ? cart.items.reduce((sum, item) => sum + item.itemTotal, 0) : 0;
    const eligible = currentTotal >= BONUS_THRESHOLD;
    const amountNeeded = eligible ? 0 : Math.max(0, BONUS_THRESHOLD - currentTotal);

    return {
      eligible,
      threshold: BONUS_THRESHOLD,
      currentTotal: Math.round(currentTotal * 100) / 100,
      amountNeeded: Math.round(amountNeeded * 100) / 100,
    };
  }

  static async applyPromo(userId: string, code: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw AppError.cartEmpty();
    }

    if (cart.promoCode) {
      throw AppError.promoAlreadyApplied();
    }

    const validPromoCodes: Record<string, number> = {
      WELCOME10: 10,
      SAVE20: 20,
      FREESHIP: 3,
    };

    const discount = validPromoCodes[code];
    if (discount === undefined) {
      throw AppError.invalidPromoCode();
    }

    cart.promoCode = code;
    cart.promoDiscount = discount;
    await cart.save();

    return this.mapCart(cart);
  }

  static async removePromo(userId: string): Promise<CartResponse> {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      throw AppError.noPromoApplied();
    }

    if (!cart.promoCode) {
      throw AppError.noPromoApplied();
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { userId },
      { $unset: { promoCode: 1, promoDiscount: 1 } },
      { new: true }
    );

    return this.mapCart(updatedCart!);
  }
}
