import { Category } from "../models/category.model.js";
import { AppError } from "../utils/errors.js";

export class CategoryService {
  static async getAll(restaurantId?: string): Promise<
    Array<{
      id: string;
      restaurantId: string;
      name: string;
      description?: string;
      image?: string;
      sortOrder: number;
    }>
  > {
    const query: Record<string, unknown> = { active: true };
    if (restaurantId) {
      query["restaurantId"] = restaurantId;
    }
    const categories = await Category.find(query).sort({ sortOrder: 1 });

    return categories.map((cat) => {
      const result: {
        id: string;
        restaurantId: string;
        name: string;
        description?: string;
        image?: string;
        sortOrder: number;
      } = {
        id: cat._id.toString(),
        restaurantId: cat.restaurantId.toString(),
        name: cat.name,
        sortOrder: cat.sortOrder,
      };
      if (cat.description) {
        result.description = cat.description;
      }
      if (cat.image) {
        result.image = cat.image;
      }
      return result;
    });
  }

  static async getById(categoryId: string): Promise<{
    id: string;
    restaurantId: string;
    name: string;
    description?: string;
    image?: string;
    sortOrder: number;
  }> {
    const category = await Category.findOne({ _id: categoryId, active: true });

    if (!category) {
      throw AppError.categoryNotFound();
    }

    const result: {
      id: string;
      restaurantId: string;
      name: string;
      description?: string;
      image?: string;
      sortOrder: number;
    } = {
      id: category._id.toString(),
      restaurantId: category.restaurantId.toString(),
      name: category.name,
      sortOrder: category.sortOrder,
    };
    if (category.description) {
      result.description = category.description;
    }
    if (category.image) {
      result.image = category.image;
    }
    return result;
  }
}
