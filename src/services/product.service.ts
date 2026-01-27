import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { AppError } from "../utils/errors.js";
import type { ProductAddOn, IProduct } from "../types/index.js";
import type { ProductQueryInput, SearchQueryInput, PaginationQueryInput } from "../validators/product.validator.js";

interface ProductResponse {
  id: string;
  restaurantId: string;
  categoryId: string;
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
}

interface ProductListResponse {
  products: ProductResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  private static mapProduct(product: IProduct): ProductResponse {
    const result: ProductResponse = {
      id: product._id.toString(),
      restaurantId: product.restaurantId.toString(),
      categoryId: product.categoryId.toString(),
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      rating: product.rating,
      reviewCount: product.reviewCount,
      cookingTime: product.cookingTime,
      addOns: product.addOns,
      available: product.available,
    };
    if (product.description) result.description = product.description;
    if (product.calories) result.calories = product.calories;
    if (product.servingSize) result.servingSize = product.servingSize;
    if (product.discount) result.discount = product.discount;
    return result;
  }

  static async getAll(input: ProductQueryInput): Promise<ProductListResponse> {
    const { category, search, available, page, limit } = input;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (category) {
      const categoryExists = await Category.exists({ _id: category, active: true });
      if (!categoryExists) {
        throw AppError.categoryNotFound();
      }
      query["categoryId"] = category;
    }

    if (available !== undefined) {
      query["available"] = available;
    }

    if (search) {
      query["$text"] = { $search: search };
    }

    const [products, total] = await Promise.all([
      Product.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products: products.map(this.mapProduct),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(productId: string): Promise<ProductResponse> {
    const product = await Product.findById(productId);

    if (!product) {
      throw AppError.productNotFound();
    }

    return this.mapProduct(product);
  }

  static async search(input: SearchQueryInput): Promise<ProductListResponse> {
    const { q, page, limit } = input;
    const skip = (page - 1) * limit;

    const query = { $text: { $search: q } };

    const [products, total] = await Promise.all([
      Product.find(query, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products: products.map(this.mapProduct),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getFeatured(input: PaginationQueryInput): Promise<ProductListResponse> {
    const { page, limit } = input;
    const skip = (page - 1) * limit;

    const query = { featured: true, available: true };

    const [products, total] = await Promise.all([
      Product.find(query).sort({ sortOrder: 1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return {
      products: products.map(this.mapProduct),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
