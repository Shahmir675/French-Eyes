import { Device } from "../models/device.model.js";
import { Order } from "../models/order.model.js";
import { AppError } from "../utils/errors.js";
import type {
  RegisterDeviceInput,
  UpdateDeviceSettingsInput,
} from "../validators/device.validator.js";
import type { IDevice, OrderPrintPayload } from "../types/index.js";

export class DeviceService {
  static async registerDevice(adminId: string, input: RegisterDeviceInput) {
    const existing = await Device.findOne({ name: input.name });
    if (existing) {
      throw AppError.deviceExists();
    }

    const token = Device.generateToken();

    const device = await Device.create({
      name: input.name,
      type: input.type,
      simNumber: input.simNumber,
      audioEnabled: input.audioEnabled ?? true,
      token,
      createdBy: adminId,
    });

    return {
      id: device._id.toString(),
      name: device.name,
      type: device.type,
      token: device.token,
      status: device.status,
      audioEnabled: device.audioEnabled,
      createdAt: device.createdAt,
    };
  }

  static async listDevices() {
    const devices = await Device.find()
      .select("-token")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return devices.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      type: d.type,
      simNumber: d.simNumber,
      audioEnabled: d.audioEnabled,
      status: d.status,
      lastSeenAt: d.lastSeenAt,
      settings: d.settings,
      createdBy: d.createdBy,
      createdAt: d.createdAt,
    }));
  }

  static async getDeviceById(deviceId: string) {
    const device = await Device.findById(deviceId)
      .select("-token")
      .populate("createdBy", "name email")
      .lean();

    if (!device) {
      throw AppError.deviceNotFound();
    }

    return device;
  }

  static async unregisterDevice(deviceId: string) {
    const result = await Device.findByIdAndDelete(deviceId);
    if (!result) {
      throw AppError.deviceNotFound();
    }
    return { success: true };
  }

  static async updateDeviceSettings(
    deviceId: string,
    input: UpdateDeviceSettingsInput
  ) {
    const updateData: Partial<IDevice> = {};

    if (input.name !== undefined) {
      const existing = await Device.findOne({
        name: input.name,
        _id: { $ne: deviceId },
      });
      if (existing) {
        throw AppError.deviceExists();
      }
      updateData.name = input.name;
    }

    if (input.audioEnabled !== undefined) {
      updateData.audioEnabled = input.audioEnabled;
    }

    if (input.settings !== undefined) {
      updateData.settings = input.settings;
    }

    const device = await Device.findByIdAndUpdate(deviceId, updateData, {
      new: true,
    })
      .select("-token")
      .lean();

    if (!device) {
      throw AppError.deviceNotFound();
    }

    return device;
  }

  static async verifyDeviceToken(token: string) {
    const device = await Device.findOne({ token }).lean();

    if (!device) {
      throw AppError.deviceTokenInvalid();
    }

    if (device.status === "inactive") {
      throw AppError.deviceInactive();
    }

    await Device.findByIdAndUpdate(device._id, {
      lastSeenAt: new Date(),
      status: "active",
    });

    return {
      deviceId: device._id.toString(),
      name: device.name,
      type: device.type,
    };
  }

  static async sendTestPrint(deviceId: string) {
    const device = await Device.findById(deviceId).lean();
    if (!device) {
      throw AppError.deviceNotFound();
    }

    const testPayload: OrderPrintPayload = {
      event: "new_order",
      order: {
        id: "test-order-123",
        orderNumber: "FE-TEST001",
        customer: { name: "Test Customer", phone: "+49 123 456789" },
        type: "delivery",
        items: [
          {
            name: "Test Product",
            quantity: 2,
            options: ["Size: Large"],
            extras: ["Extra Cheese"],
            notes: "Test notes",
          },
        ],
        notes: "This is a test print",
        total: 25.5,
        createdAt: new Date().toISOString(),
      },
    };

    return {
      success: true,
      deviceId,
      testPayload,
    };
  }

  static async formatOrderForPrint(orderId: string): Promise<OrderPrintPayload> {
    const order = await Order.findById(orderId)
      .populate("userId", "name phone")
      .populate("bonusId", "name")
      .lean();

    if (!order) {
      throw AppError.orderNotFound();
    }

    const user = order.userId as unknown as { name: string; phone: string };
    const bonus = order.bonusId as unknown as { name: { en: string } } | null;

    const items = order.items.map((item) => {
      const mapped: {
        name: string;
        quantity: number;
        options: string[];
        extras: string[];
        notes?: string;
      } = {
        name: item.productName.en,
        quantity: item.quantity,
        options: item.selectedOptions.map((o) => `${o.name}: ${o.choice}`),
        extras: item.selectedExtras.map((e) => e.name),
      };
      if (item.notes) {
        mapped.notes = item.notes;
      }
      return mapped;
    });

    const orderData: OrderPrintPayload["order"] = {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: {
        name: user?.name || "Guest",
        phone: user?.phone || "",
      },
      type: order.type,
      items,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
    };

    if (order.notes) {
      orderData.notes = order.notes;
    }

    if (bonus) {
      orderData.bonus = { name: bonus.name.en };
    }

    return {
      event: "new_order" as const,
      order: orderData,
    };
  }

  static async updateDeviceStatus(
    deviceId: string,
    status: "active" | "inactive" | "offline"
  ) {
    const device = await Device.findByIdAndUpdate(
      deviceId,
      { status },
      { new: true }
    )
      .select("-token")
      .lean();

    if (!device) {
      throw AppError.deviceNotFound();
    }

    return device;
  }

  static async regenerateToken(deviceId: string) {
    const device = await Device.findById(deviceId);
    if (!device) {
      throw AppError.deviceNotFound();
    }

    const newToken = Device.generateToken();
    device.token = newToken;
    await device.save();

    return {
      id: device._id.toString(),
      name: device.name,
      token: newToken,
    };
  }
}
