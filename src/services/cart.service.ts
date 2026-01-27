import { Types } from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import { AppError } from "../utils/errors.js";
import type {
  ICart,
  ICartItem,
  SelectedAddOn,
  CartCalculation,
} from "../types/index.js";
import type {
  AddCartItemInput,
  UpdateCartItemInput,
  CalculateCartInput,
} from "../validators/cart.validator.js";

const DEFAULT_DELIVERY_FEE = 3.0;

interface CartItemResponse {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  selectedAddOns: SelectedAddOn[];
  specialInstructions?: string;
  itemTotal: number;
}

interface CartResponse {
  id: string;
  restaurantId?: string;
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
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: item.quantity,
      selectedAddOns: item.selectedAddOns,
      itemTotal: item.itemTotal,
    };

    if (item.specialInstructions) {
      response.specialInstructions = item.specialInstructions;
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

    if (cart.restaurantId) {
      response.restaurantId = cart.restaurantId.toString();
    }

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
    selectedAddOns: SelectedAddOn[]
  ): number {
    const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    return Math.round((basePrice + addOnsTotal) * quantity * 100) / 100;
  }

  static async getCart(userId: string): Promise<CartResponse> {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    return this.mapCart(cart);
  }

  static async addItem(userId: string, input: AddCartItemInput): Promise<CartResponse> {
    const { restaurantId, productId, quantity, selectedAddOns, specialInstructions } = input;

    const product = await Product.findById(productId);
    if (!product) {
      throw AppError.productNotFound();
    }

    if (!product.available) {
      throw AppError.productUnavailable();
    }

    // Verify restaurant matches
    if (product.restaurantId.toString() !== restaurantId) {
      throw AppError.validation("Product does not belong to specified restaurant");
    }

    // Validate add-ons
    const validatedAddOns: SelectedAddOn[] = [];
    for (const selected of selectedAddOns || []) {
      const productAddOn = product.addOns.find((addon) => addon.name === selected.name);
      if (!productAddOn) {
        throw AppError.invalidOptionSelection(`Unknown add-on: ${selected.name}`);
      }

      validatedAddOns.push({
        name: selected.name,
        price: productAddOn.price,
      });
    }

    const itemTotal = this.calculateItemTotal(product.price, quantity, validatedAddOns);

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, restaurantId: new Types.ObjectId(restaurantId), items: [] });
    } else if (cart.restaurantId && cart.restaurantId.toString() !== restaurantId) {
      // Clear cart if different restaurant
      cart.items = [];
      cart.restaurantId = new Types.ObjectId(restaurantId);
      delete (cart as unknown as Record<string, unknown>)["promoCode"];
      delete (cart as unknown as Record<string, unknown>)["promoDiscount"];
    } else if (!cart.restaurantId) {
      cart.restaurantId = new Types.ObjectId(restaurantId);
    }

    const newItem = {
      _id: new Types.ObjectId(),
      productId: new Types.ObjectId(productId),
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      quantity,
      selectedAddOns: validatedAddOns,
      specialInstructions,
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

    if (input.selectedAddOns !== undefined) {
      const product = await Product.findById(item.productId);
      if (!product) {
        throw AppError.productNotFound();
      }

      const validatedAddOns: SelectedAddOn[] = [];
      for (const selected of input.selectedAddOns) {
        const productAddOn = product.addOns.find((addon) => addon.name === selected.name);
        if (!productAddOn) {
          throw AppError.invalidOptionSelection(`Unknown add-on: ${selected.name}`);
        }

        validatedAddOns.push({
          name: selected.name,
          price: productAddOn.price,
        });
      }

      item.selectedAddOns = validatedAddOns;
    }

    if (input.specialInstructions !== undefined) {
      item.specialInstructions = input.specialInstructions;
    }

    item.itemTotal = this.calculateItemTotal(item.price, item.quantity, item.selectedAddOns);

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
    const { tip } = input;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return {
        subtotal: 0,
        deliveryFee: 0,
        tip: tip,
        discount: 0,
        total: tip,
      };
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.itemTotal, 0);

    // Get delivery fee from restaurant if available
    let deliveryFee = DEFAULT_DELIVERY_FEE;
    if (cart.restaurantId) {
      const restaurant = await Restaurant.findById(cart.restaurantId);
      if (restaurant) {
        deliveryFee = restaurant.deliveryFee;
      }
    }

    const discount = cart.promoDiscount || 0;
    const total = Math.max(0, subtotal + deliveryFee + tip - discount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      tip,
      discount,
      total: Math.round(total * 100) / 100,
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
