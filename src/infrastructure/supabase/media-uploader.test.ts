import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalMedia } from "@/domain/media";
import { uploadPrivateMedia } from "@/infrastructure/supabase/media-uploader";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const media: LocalMedia = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  userId: USER_ID,
  dayId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  momentId: null,
  mimeType: "image/jpeg",
  byteSize: 5,
  width: 20,
  height: 10,
  caption: "",
  objectKey: null,
  status: "pending_upload",
  uploadAttempts: 0,
  lastError: null,
  createdAt: "2026-08-12T10:00:00.000Z",
  updatedAt: "2026-08-12T10:00:00.000Z",
  version: 0,
  syncState: "pending",
  deletedAt: null,
  blob: new Blob(["photo"], { type: "image/jpeg" }),
};

function clientFor(userId: string | null, error: Error | null = null) {
  const upload = vi.fn().mockResolvedValue({ error });
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    storage: { from: vi.fn().mockReturnValue({ upload }) },
  } as unknown as SupabaseClient;
  return { client, upload };
}

describe("private media uploader", () => {
  it("derives an owner-prefixed key from the verified user", async () => {
    const { client, upload } = clientFor(USER_ID);
    const key = await uploadPrivateMedia(client, media);
    expect(key).toBe(`${USER_ID}/${media.id}/original.jpg`);
    expect(upload).toHaveBeenCalledWith(key, media.blob, expect.objectContaining({ upsert: true }));
  });

  it("refuses to upload a record for a different owner", async () => {
    const { client, upload } = clientFor("22222222-2222-4222-8222-222222222222");
    await expect(uploadPrivateMedia(client, media)).rejects.toThrow("Sign in again");
    expect(upload).not.toHaveBeenCalled();
  });

  it("keeps provider errors private and explains that the local copy is safe", async () => {
    const { client } = clientFor(USER_ID, new Error("secret provider details"));
    await expect(uploadPrivateMedia(client, media)).rejects.toThrow(
      "Photo upload is waiting. Your local copy is safe.",
    );
  });
});
