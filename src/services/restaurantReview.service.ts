import { RestaurantReview } from "../models/restaurantReview.model.js";
import { Restaurant } from "../models/restaurant.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/errors.js";
import type { CreateReviewInput, GetReviewsQuery } from "../validators/restaurantReview.validator.js";

export class RestaurantReviewService {
  static async create(
    userId: string,
    restaurantId: string,
    input: CreateReviewInput
  ) {
    const restaurant = await Restaurant.findOne({ _id: restaurantId, active: true });
    if (!restaurant) {
      throw AppError.notFound("Restaurant not found");
    }

    const existingReview = await RestaurantReview.findOne({
      userId,
      restaurantId,
    });

    if (existingReview) {
      throw AppError.validation("You have already reviewed this restaurant");
    }

    const user = await User.findById(userId).select("fullName profilePicture");
    if (!user) {
      throw AppError.notFound("User not found");
    }

    const review = await RestaurantReview.create({
      restaurantId,
      userId,
      orderId: input.orderId,
      rating: input.rating,
      comment: input.comment,
      userName: user.fullName,
      userAvatar: user.profilePicture,
    });

    await this.updateRestaurantRating(restaurantId);

    return review;
  }

  static async getByRestaurant(restaurantId: string, query: GetReviewsQuery) {
    const { page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const sortOptions: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const [reviews, total] = await Promise.all([
      RestaurantReview.find({ restaurantId })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      RestaurantReview.countDocuments({ restaurantId }),
    ]);

    return {
      reviews: reviews.map((review) => ({
        id: review._id,
        rating: review.rating,
        comment: review.comment,
        userName: review.userName,
        userAvatar: review.userAvatar,
        createdAt: review.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateRestaurantRating(restaurantId: string) {
    const result = await RestaurantReview.aggregate([
      { $match: { restaurantId: restaurantId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      const { averageRating, reviewCount } = result[0];
      await Restaurant.updateOne(
        { _id: restaurantId },
        {
          rating: Math.round(averageRating * 10) / 10,
          reviewCount,
        }
      );
    }
  }
}
