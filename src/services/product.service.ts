import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { AppError } from "../utils/errors.js";
import type { LocalizedString, ProductOption, ProductExtra } from "../types/index.js";
import type { ProductQueryInput, SearchQueryInput, PaginationQueryInput } from "../validators/product.validator.js";

interface ProductResponse {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  categoryId: string;
  images: string[];
  options: ProductOption[];
  extras: ProductExtra[];
  allergens: string[];
  available: boolean;
  preparationTime: number;
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
  private static mapProduct(product: {
    _id: { toString: () => string };
    name: LocalizedString;
    description: LocalizedString;
    price: number;
    categoryId: { toString: () => string };
    images: string[];
    options: ProductOption[];
    extras: ProductExtra[];
    allergens: string[];
    available: boolean;
    preparationTime: number;
  }): ProductResponse {
    return {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      categoryId: product.categoryId.toString(),
      images: product.images,
      options: product.options,
      extras: product.extras,
      allergens: product.allergens,
      available: product.available,
      preparationTime: product.preparationTime,
    };
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
