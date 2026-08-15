import { z } from "zod";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  LocalDateSchema,
  SyncStateSchema,
} from "@/domain/shared";

export const KeepsakeSourceSchema = z.enum([
  "moment",
  "photo",
  "journal",
  "day",
  "monthly_recap",
  "monthly_reflection",
  "doodle",
]);

export const KeepsakeSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  sourceType: KeepsakeSourceSchema,
  sourceId: z.string().min(1),
  dayId: EntityIdSchema.nullable(),
  localDate: LocalDateSchema.nullable(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable(),
  title: z.string().max(160),
  preview: z.string().max(280),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type Keepsake = z.infer<typeof KeepsakeSchema>;
export type KeepsakeSource = z.infer<typeof KeepsakeSourceSchema>;

export const DoodlePointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  pressure: z.number().min(0).max(1),
});
export const DoodleStrokeSchema = z.object({
  id: EntityIdSchema,
  tool: z.enum(["pen", "eraser"]),
  color: z.enum(["ink", "coral", "powder", "sage", "lavender"]),
  size: z.number().min(1).max(24),
  points: z.array(DoodlePointSchema).min(1).max(8_000),
});
export const DoodleSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  dayId: EntityIdSchema,
  localDate: LocalDateSchema,
  title: z.string().max(120),
  description: z.string().max(500),
  width: z.number().int().positive().max(4_096),
  height: z.number().int().positive().max(4_096),
  strokes: z.array(DoodleStrokeSchema).max(2_000),
  previewDataUrl: z.string().max(800_000),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type Doodle = z.infer<typeof DoodleSchema>;
export type DoodleStroke = z.infer<typeof DoodleStrokeSchema>;

export const HiddenMemorySchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  scope: z.enum(["item", "day"]),
  entityType: z.enum(["moment", "photo", "journal", "day", "doodle"]),
  entityId: z.string().min(1),
  dayId: EntityIdSchema,
  createdAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type HiddenMemory = z.infer<typeof HiddenMemorySchema>;

export interface WorldSummary {
  dayCount: number;
  photoCount: number;
  keepsakeCount: number;
  doodleCount: number;
  trackerCount: number;
  completedMonthCount: number;
}

export interface ResurfacedMemory {
  entityType: "moment" | "photo" | "journal" | "doodle";
  entityId: string;
  dayId: string;
  localDate: z.infer<typeof LocalDateSchema>;
  title: string;
  preview: string;
  previewDataUrl?: string;
  previewBlob?: Blob;
}
