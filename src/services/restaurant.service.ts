import { Restaurant } from "../models/restaurant.model.js";
import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { AppError } from "../utils/errors.js";
import type {
  GetRestaurantsQuery,
  GetNearbyQuery,
  SearchRestaurantsQuery,
} from "../validators/restaurant.validator.js";

export class RestaurantService {
  static async getAll(query: GetRestaurantsQuery) {
    const { page, limit, search, cuisineType, isOpen, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { active: true };

    if (search) {
      filter["$text"] = { $search: search };
    }

    if (cuisineType) {
      filter["cuisineTypes"] = cuisineType;
    }

    if (typeof isOpen === "boolean") {
      filter["isOpen"] = isOpen;
    }

    const sortOptions: Record<string, 1 | -1> = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions["rating"] = -1;
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filter),
    ]);

    return {
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    const restaurant = await Restaurant.findOne({ _id: id, active: true }).lean();

    if (!restaurant) {
      throw AppError.notFound("Restaurant not found");
    }

    return restaurant;
  }

  static async getMenu(restaurantId: string) {
    const restaurant = await Restaurant.findOne({ _id: restaurantId, active: true });

    if (!restaurant) {
      throw AppError.notFound("Restaurant not found");
    }

    const categories = await Category.find({
      restaurantId,
      active: true,
    })
      .sort({ sortOrder: 1 })
      .lean();

    const products = await Product.find({
      restaurantId,
      available: true,
    })
      .sort({ sortOrder: 1 })
      .lean();

    const menuByCategory = categories.map((category) => ({
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        image: category.image,
      },
      items: products
        .filter((p) => p.categoryId.toString() === category._id.toString())
        .map((product) => ({
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
          calories: product.calories,
          servingSize: product.servingSize,
          cookingTime: product.cookingTime,
          addOns: product.addOns,
          discount: product.discount,
          available: product.available,
        })),
    }));

    return {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        imageUrl: restaurant.imageUrl,
        rating: restaurant.rating,
        reviewCount: restaurant.reviewCount,
        priceRange: restaurant.priceRange,
        deliveryTime: restaurant.deliveryTime,
        deliveryFee: restaurant.deliveryFee,
        satisfactionScore: restaurant.satisfactionScore,
        isOpen: restaurant.isOpen,
      },
      menu: menuByCategory,
    };
  }

  static async search(query: SearchRestaurantsQuery) {
    const { query: searchQuery, page, limit } = query;
    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      Restaurant.find({
        active: true,
        $text: { $search: searchQuery },
      })
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limit)
        .lean(),
      Restaurant.countDocuments({
        active: true,
        $text: { $search: searchQuery },
      }),
    ]);

    return {
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getNearby(query: GetNearbyQuery) {
    const { lat, lng, radius, page, limit } = query;
    const skip = (page - 1) * limit;

    const earthRadiusKm = 6371;
    const maxDistance = radius / earthRadiusKm;

    const restaurants = await Restaurant.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          maxDistance: maxDistance * earthRadiusKm * 1000,
          spherical: true,
          query: { active: true },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    const total = await Restaurant.countDocuments({
      active: true,
      coordinates: {
        $geoWithin: {
          $centerSphere: [[lng, lat], maxDistance],
        },
      },
    });

    return {
      restaurants: restaurants.map((r) => ({
        ...r,
        distance: Math.round((r.distance / 1000) * 10) / 10,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
