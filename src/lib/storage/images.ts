import { randomUUID } from "node:crypto";
import { getStorage } from "./index";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Detected = { ext: "jpg" | "png" | "webp"; contentType: string };

/** Identify an image by its magic bytes (never trust the client's MIME type). */
export function detectImage(buf: Uint8Array): Detected | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return { ext: "png", contentType: "image/png" };
  }
  if (
    buf.length >= 12 &&
    String.fromCharCode(buf[0], buf[1], buf[2], buf[3]) === "RIFF" &&
    String.fromCharCode(buf[8], buf[9], buf[10], buf[11]) === "WEBP"
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

export type SaveImageResult = { ok: true; key: string } | { ok: false; error: string };

/**
 * Validate and store an uploaded image. Returns { ok: true, key } or an error.
 * An empty file input (no file chosen) returns { ok: false, error: "" }.
 */
export async function saveImage(file: FormDataEntryValue | null, folder: "profiles" | "posts"): Promise<SaveImageResult> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: false, error: "" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Photo must be 5 MB or smaller." };
  const buf = Buffer.from(await file.arrayBuffer());
  const detected = detectImage(buf);
  if (!detected) return { ok: false, error: "Photo must be a JPEG, PNG, or WebP image." };
  const key = `${folder}/${randomUUID()}.${detected.ext}`;
  await getStorage().put(key, buf, detected.contentType);
  return { ok: true, key };
}
