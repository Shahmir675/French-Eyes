import { Types } from "mongoose";
import { User } from "../models/user.model.js";
import { LoyaltyTransaction } from "../models/loyaltyTransaction.model.js";
import { LoyaltyReward } from "../models/loyaltyReward.model.js";
import { BonusItem } from "../models/bonus.model.js";
import { AppError } from "../utils/errors.js";
import type { LocalizedString, LoyaltyTransactionType } from "../types/index.js";

const POINTS_PER_EURO = 0.1;

interface PointsBalanceResponse {
  points: number;
  totalEarned: number;
  totalRedeemed: number;
}

interface TransactionResponse {
  id: string;
  type: string;
  points: number;
  description: string;
  orderId: string | undefined;
  rewardId: string | undefined;
  createdAt: Date;
}

interface TransactionHistoryResponse {
  transactions: TransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RewardResponse {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  pointsCost: number;
  type: string;
  value: number;
  productId: string | undefined;
  validFrom: Date | undefined;
  validUntil: Date | undefined;
}

interface RedemptionResponse {
  success: boolean;
  reward: RewardResponse;
  pointsDeducted: number;
  remainingPoints: number;
  transactionId: string;
}

interface BonusResponse {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  image: string | undefined;
  minOrderAmount: number;
  validFrom: Date | undefined;
  validUntil: Date | undefined;
}

interface LeanTransaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: LoyaltyTransactionType;
  points: number;
  orderId?: Types.ObjectId;
  rewardId?: Types.ObjectId;
  description: string;
  createdAt: Date;
}

interface LeanReward {
  _id: Types.ObjectId;
  name: LocalizedString;
  description: LocalizedString;
  pointsCost: number;
  type: string;
  value: number;
  productId?: Types.ObjectId;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

interface LeanBonus {
  _id: Types.ObjectId;
  name: LocalizedString;
  description: LocalizedString;
  image?: string;
  minOrderAmount: number;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
  sortOrder: number;
}

export class LoyaltyService {
  private static mapTransaction(transaction: LeanTransaction): TransactionResponse {
    return {
      id: transaction._id.toString(),
      type: transaction.type,
      points: transaction.points,
      description: transaction.description,
      orderId: transaction.orderId?.toString(),
      rewardId: transaction.rewardId?.toString(),
      createdAt: transaction.createdAt,
    };
  }

  private static mapReward(reward: LeanReward): RewardResponse {
    return {
      id: reward._id.toString(),
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      type: reward.type,
      value: reward.value,
      productId: reward.productId?.toString(),
      validFrom: reward.validFrom,
      validUntil: reward.validUntil,
    };
  }

  private static mapBonus(bonus: LeanBonus): BonusResponse {
    return {
      id: bonus._id.toString(),
      name: bonus.name,
      description: bonus.description,
      image: bonus.image,
      minOrderAmount: bonus.minOrderAmount,
      validFrom: bonus.validFrom,
      validUntil: bonus.validUntil,
    };
  }

  private static isRewardCurrentlyValid(reward: LeanReward): boolean {
    const now = new Date();
    if (reward.validFrom && now < reward.validFrom) return false;
    if (reward.validUntil && now > reward.validUntil) return false;
    return true;
  }

  private static isBonusCurrentlyActive(bonus: LeanBonus): boolean {
    const now = new Date();
    if (bonus.validFrom && now < bonus.validFrom) return false;
    if (bonus.validUntil && now > bonus.validUntil) return false;
    return true;
  }

  static async getPointsBalance(userId: string): Promise<PointsBalanceResponse> {
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.userNotFound();
    }

    const aggregation = await LoyaltyTransaction.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalEarned: {
            $sum: { $cond: [{ $gt: ["$points", 0] }, "$points", 0] },
          },
          totalRedeemed: {
            $sum: { $cond: [{ $lt: ["$points", 0] }, { $abs: "$points" }, 0] },
          },
        },
      },
    ]);

    const stats = aggregation[0] || { totalEarned: 0, totalRedeemed: 0 };

    return {
      points: user.loyaltyPoints,
      totalEarned: stats.totalEarned,
      totalRedeemed: stats.totalRedeemed,
    };
  }

  static async getTransactionHistory(
    userId: string,
    page: number,
    limit: number
  ): Promise<TransactionHistoryResponse> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      LoyaltyTransaction.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanTransaction[]>(),
      LoyaltyTransaction.countDocuments({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
      transactions: transactions.map((t) => this.mapTransaction(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async earnPoints(
    userId: string,
    orderId: string,
    orderTotal: number
  ): Promise<number> {
    const pointsEarned = Math.floor(orderTotal * POINTS_PER_EURO);

    if (pointsEarned <= 0) {
      return 0;
    }

    try {
      await LoyaltyTransaction.create({
        userId: new Types.ObjectId(userId),
        type: "earn",
        points: pointsEarned,
        orderId: new Types.ObjectId(orderId),
        description: `Earned from order`,
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const existing = await LoyaltyTransaction.findOne({
          orderId: new Types.ObjectId(orderId),
          type: "earn",
        });
        return existing?.points || 0;
      }
      throw error;
    }

    await User.findByIdAndUpdate(userId, {
      $inc: { loyaltyPoints: pointsEarned },
    });

    return pointsEarned;
  }

  static async getAvailableRewards(): Promise<RewardResponse[]> {
    const rewards = await LoyaltyReward.find({ active: true })
      .sort({ pointsCost: 1 })
      .lean<LeanReward[]>();

    return rewards
      .filter((r) => this.isRewardCurrentlyValid(r))
      .map((r) => this.mapReward(r));
  }

  static async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<RedemptionResponse> {
    const reward = await LoyaltyReward.findById(rewardId).lean<LeanReward>();
    if (!reward) {
      throw AppError.rewardNotFound();
    }

    if (!reward.active) {
      throw AppError.rewardUnavailable();
    }

    if (!this.isRewardCurrentlyValid(reward)) {
      throw AppError.rewardUnavailable();
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: new Types.ObjectId(userId),
        loyaltyPoints: { $gte: reward.pointsCost },
      },
      {
        $inc: { loyaltyPoints: -reward.pointsCost },
      },
      { new: true }
    );

    if (!updatedUser) {
      const user = await User.findById(userId);
      if (!user) {
        throw AppError.userNotFound();
      }
      throw AppError.insufficientPoints();
    }

    const transaction = await LoyaltyTransaction.create({
      userId: new Types.ObjectId(userId),
      type: "redeem",
      points: -reward.pointsCost,
      rewardId: reward._id,
      description: `Redeemed: ${reward.name.en}`,
    });

    return {
      success: true,
      reward: this.mapReward(reward),
      pointsDeducted: reward.pointsCost,
      remainingPoints: updatedUser.loyaltyPoints,
      transactionId: transaction._id.toString(),
    };
  }

  static async getAllBonuses(): Promise<BonusResponse[]> {
    const bonuses = await BonusItem.find({ active: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean<LeanBonus[]>();

    return bonuses.map((b) => this.mapBonus(b));
  }

  static async getActiveBonuses(): Promise<BonusResponse[]> {
    const bonuses = await BonusItem.find({ active: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean<LeanBonus[]>();

    return bonuses
      .filter((b) => this.isBonusCurrentlyActive(b))
      .map((b) => this.mapBonus(b));
  }

  static async getBonusById(bonusId: string): Promise<BonusResponse> {
    const bonus = await BonusItem.findById(bonusId).lean<LeanBonus>();
    if (!bonus || !bonus.active) {
      throw AppError.bonusNotFound();
    }

    return this.mapBonus(bonus);
  }
}
