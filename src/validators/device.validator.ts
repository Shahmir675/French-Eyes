import { z } from "zod";

export const registerDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["thermal_printer", "pos_terminal", "display"]),
  simNumber: z.string().max(50).optional(),
  audioEnabled: z.boolean().optional().default(true),
});

export const updateDeviceSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  audioEnabled: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const deviceIdParamSchema = z.object({
  id: z.string().min(1),
});

export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
export type UpdateDeviceSettingsInput = z.infer<typeof updateDeviceSettingsSchema>;
