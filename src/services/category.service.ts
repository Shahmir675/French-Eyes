import { Category } from "../models/category.model.js";
import { AppError } from "../utils/errors.js";
import type { LocalizedString } from "../types/index.js";

export class CategoryService {
  static async getAll(): Promise<
    Array<{
      id: string;
      name: LocalizedString;
      description: LocalizedString;
      image?: string;
      sortOrder: number;
    }>
  > {
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1 });

    return categories.map((cat) => {
      const result: {
        id: string;
        name: LocalizedString;
        description: LocalizedString;
        image?: string;
        sortOrder: number;
      } = {
        id: cat._id.toString(),
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
      };
      if (cat.image) {
        result.image = cat.image;
      }
      return result;
    });
  }

  static async getById(categoryId: string): Promise<{
    id: string;
    name: LocalizedString;
    description: LocalizedString;
    image?: string;
    sortOrder: number;
  }> {
    const category = await Category.findOne({ _id: categoryId, active: true });

    if (!category) {
      throw AppError.categoryNotFound();
    }

    const result: {
      id: string;
      name: LocalizedString;
      description: LocalizedString;
      image?: string;
      sortOrder: number;
    } = {
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
    };
    if (category.image) {
      result.image = category.image;
    }
    return result;
  }
}
