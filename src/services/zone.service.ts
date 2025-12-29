import { DeliveryZone } from "../models/zone.model.js";
import { AppError } from "../utils/errors.js";
import type { IDeliveryZone, TimeSlot, ZoneCoordinates } from "../types/index.js";
import type {
  ValidateAddressInput,
  CheckDeliverableQuery,
  GetSlotsQuery,
} from "../validators/zone.validator.js";

interface ZoneValidationResponse {
  deliverable: boolean;
  zoneId: string;
  zoneName: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
}

interface ZoneFeesResponse {
  zoneId: string;
  zoneName: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: string;
}

interface CheckDeliverableResponse {
  deliverable: boolean;
  zone?: {
    id: string;
    name: string;
    deliveryFee: number;
    minimumOrder: number;
    estimatedTime: string;
  };
}

interface SlotsResponse {
  date: string;
  slots: TimeSlot[];
}

export class ZoneService {
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private static async findZoneByZipCode(zipCode: string): Promise<IDeliveryZone | null> {
    return DeliveryZone.findOne({
      active: true,
      type: "zip",
      zipCodes: zipCode,
    });
  }

  private static async findZoneByCoordinates(
    coordinates: ZoneCoordinates
  ): Promise<IDeliveryZone | null> {
    const radiusZones = await DeliveryZone.find({
      active: true,
      type: "radius",
      center: { $exists: true },
      radiusKm: { $exists: true },
    });

    for (const zone of radiusZones) {
      if (zone.center && zone.radiusKm) {
        const distance = this.calculateDistance(
          coordinates.lat,
          coordinates.lng,
          zone.center.lat,
          zone.center.lng
        );
        if (distance <= zone.radiusKm) {
          return zone;
        }
      }
    }

    return null;
  }

  private static extractZipFromAddress(address: string): string | null {
    const germanZipMatch = address.match(/\b\d{5}\b/);
    if (germanZipMatch) {
      return germanZipMatch[0];
    }

    const usZipMatch = address.match(/\b\d{5}(-\d{4})?\b/);
    if (usZipMatch) {
      return usZipMatch[0];
    }

    return null;
  }

  static async validateAddress(input: ValidateAddressInput): Promise<ZoneValidationResponse> {
    let zone: IDeliveryZone | null = null;

    if (input.zipCode) {
      zone = await this.findZoneByZipCode(input.zipCode);
    }

    if (!zone && input.coordinates) {
      zone = await this.findZoneByCoordinates(input.coordinates);
    }

    if (!zone && input.address) {
      const extractedZip = this.extractZipFromAddress(input.address);
      if (extractedZip) {
        zone = await this.findZoneByZipCode(extractedZip);
      }
    }

    if (!zone) {
      throw AppError.addressNotDeliverable();
    }

    return {
      deliverable: true,
      zoneId: zone._id.toString(),
      zoneName: zone.name,
      deliveryFee: zone.deliveryFee,
      minimumOrder: zone.minimumOrder,
      estimatedTime: zone.estimatedTime,
    };
  }

  static async getZoneFees(zoneId: string): Promise<ZoneFeesResponse> {
    const zone = await DeliveryZone.findOne({
      _id: zoneId,
      active: true,
    });

    if (!zone) {
      throw AppError.zoneNotFound();
    }

    return {
      zoneId: zone._id.toString(),
      zoneName: zone.name,
      deliveryFee: zone.deliveryFee,
      minimumOrder: zone.minimumOrder,
      estimatedTime: zone.estimatedTime,
    };
  }

  static async getSlots(query: GetSlotsQuery): Promise<SlotsResponse> {
    const targetDate = query.date
      ? new Date(query.date)
      : new Date();

    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dateStr = targetDate.toISOString().split("T")[0];
    if (!dateStr) {
      throw AppError.validation("Invalid date");
    }

    const slots: TimeSlot[] = [];

    const openHour = isWeekend ? 10 : 11;
    const closeHour = isWeekend ? 23 : 22;

    const now = new Date();
    const isToday = dateStr === now.toISOString().split("T")[0];
    const currentHour = now.getHours();

    for (let hour = openHour; hour < closeHour; hour++) {
      const startTime = `${hour.toString().padStart(2, "0")}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

      let isAvailable = true;
      if (isToday && hour <= currentHour + 1) {
        isAvailable = false;
      }

      if (!query.type || query.type === "delivery") {
        slots.push({
          id: `delivery-${dateStr}-${hour}`,
          startTime,
          endTime,
          available: isAvailable,
          type: "delivery",
        });
      }

      if (!query.type || query.type === "pickup") {
        slots.push({
          id: `pickup-${dateStr}-${hour}`,
          startTime,
          endTime,
          available: isAvailable,
          type: "pickup",
        });
      }
    }

    return {
      date: dateStr,
      slots,
    };
  }

  static async checkDeliverable(query: CheckDeliverableQuery): Promise<CheckDeliverableResponse> {
    let zone: IDeliveryZone | null = null;

    if (query.zipCode) {
      zone = await this.findZoneByZipCode(query.zipCode);
    }

    if (!zone && query.lat !== undefined && query.lng !== undefined) {
      zone = await this.findZoneByCoordinates({ lat: query.lat, lng: query.lng });
    }

    if (!zone && query.address) {
      const extractedZip = this.extractZipFromAddress(query.address);
      if (extractedZip) {
        zone = await this.findZoneByZipCode(extractedZip);
      }
    }

    if (!zone) {
      return { deliverable: false };
    }

    return {
      deliverable: true,
      zone: {
        id: zone._id.toString(),
        name: zone.name,
        deliveryFee: zone.deliveryFee,
        minimumOrder: zone.minimumOrder,
        estimatedTime: zone.estimatedTime,
      },
    };
  }

  static async getAllActiveZones(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    deliveryFee: number;
    minimumOrder: number;
    estimatedTime: string;
  }>> {
    const zones = await DeliveryZone.find({ active: true });

    return zones.map((zone) => ({
      id: zone._id.toString(),
      name: zone.name,
      type: zone.type,
      deliveryFee: zone.deliveryFee,
      minimumOrder: zone.minimumOrder,
      estimatedTime: zone.estimatedTime,
    }));
  }
}
