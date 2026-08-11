export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface PreparedImage {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
    throw new Error("Try a JPEG, PNG, or WebP image.");
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error("That photo is over 20 MB.");

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser couldn't prepare the photo.");
    context.drawImage(bitmap, 0, 0, width, height);
    const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("This photo couldn't be prepared."))),
        mimeType,
        mimeType === "image/jpeg" ? 0.9 : undefined,
      ),
    );
    return { blob, mimeType, width, height };
  } finally {
    bitmap.close();
  }
}
