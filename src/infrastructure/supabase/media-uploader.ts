import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalMedia } from "@/domain/media";

const extensionFor = (mime: string) =>
  ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" })[mime] ?? "bin";

export async function uploadPrivateMedia(
  client: SupabaseClient,
  media: LocalMedia,
): Promise<string> {
  if (!media.blob) throw new Error("The local photo is missing.");
  const { data: auth } = await client.auth.getUser();
  const user = auth.user;
  if (!user || user.id !== media.userId) throw new Error("Sign in again before syncing photos.");
  const objectKey = `${user.id}/${media.id}/original.${extensionFor(media.mimeType)}`;
  const { error } = await client.storage.from("journal-media").upload(objectKey, media.blob, {
    contentType: media.mimeType,
    upsert: true,
  });
  if (error) throw new Error("Photo upload is waiting. Your local copy is safe.");
  return objectKey;
}
