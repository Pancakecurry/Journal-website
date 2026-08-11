import { z } from "zod";
import {
  EntityIdSchema,
  IsoTimestampSchema,
  SyncStateSchema,
  newEntityId,
  nowIso,
} from "@/domain/shared";

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
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  caption: z.string().max(2_000),
  objectKey: z.string().nullable(),
  status: MediaStatusSchema,
  uploadAttempts: z.number().int().nonnegative(),
  lastError: z.string().nullable(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  version: z.number().int().nonnegative(),
  syncState: SyncStateSchema,
  deletedAt: IsoTimestampSchema.nullable(),
});
export type MediaReference = z.infer<typeof MediaReferenceSchema>;
export type LocalMedia = MediaReference & { blob: Blob | null };

export function createLocalMedia(
  input: Pick<LocalMedia, "userId" | "dayId" | "mimeType" | "width" | "height" | "blob"> & {
    caption?: string;
  },
): LocalMedia {
  const timestamp = nowIso();
  return {
    ...MediaReferenceSchema.parse({
      ...input,
      id: newEntityId(),
      momentId: null,
      byteSize: input.blob?.size ?? 0,
      caption: input.caption ?? "",
      objectKey: null,
      status: "local",
      uploadAttempts: 0,
      lastError: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 0,
      syncState: "pending",
      deletedAt: null,
    }),
    blob: input.blob,
  };
}
