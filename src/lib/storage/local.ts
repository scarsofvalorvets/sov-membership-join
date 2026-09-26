import { promises as fs } from "node:fs";
import path from "node:path";
import type { StorageDriver, StoredObject } from "./types";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Keys look like "profiles/3f1c…e2.jpg": lowercase segments, no traversal. */
export function isSafeKey(key: string): boolean {
  return /^[a-z0-9-]+\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(key);
}

/** Dev driver: files on local disk under UPLOADS_DIR (gitignored), served by /api/uploads. */
export class LocalDiskStorage implements StorageDriver {
  readonly name = "local";
  constructor(private readonly root: string) {}

  private resolve(key: string): string {
    if (!isSafeKey(key)) throw new Error("Invalid storage key");
    return path.join(this.root, key);
  }

  async put(key: string, data: Buffer): Promise<void> {
    const file = this.resolve(key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  }

  async get(key: string): Promise<StoredObject | null> {
    if (!isSafeKey(key)) return null;
    try {
      const data = await fs.readFile(this.resolve(key));
      return { data, contentType: CONTENT_TYPES[path.extname(key)] ?? "application/octet-stream" };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!isSafeKey(key)) return;
    await fs.rm(this.resolve(key), { force: true });
  }

  url(key: string): string {
    return `/api/uploads/${key}`;
  }
}
