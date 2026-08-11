import { z } from "zod";
import { EntityIdSchema, IsoTimestampSchema, SyncStateSchema } from "@/domain/shared";

export const MediaStatusSchema = z.enum([
  "local",
  "pending_upload",
  "uploading",
  "uploaded",
  "failed",
  "pending_delete",
]);

export const MediaReferenceSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  dayId: EntityIdSchema,
  momentId: EntityIdSchema.nullable(),
  mimeType: z.string().min(1),
  byteSize: z.number().int().nonnegative(),
  objectKey: z.string().nullable(),
  status: MediaStatusSchema,
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type MediaReference = z.infer<typeof MediaReferenceSchema>;
export type LocalMedia = MediaReference & { blob: Blob | null };
