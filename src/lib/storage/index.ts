import path from "node:path";
import { LocalDiskStorage } from "./local";
import type { StorageDriver } from "./types";

export type { StorageDriver } from "./types";

let driver: StorageDriver | null = null;

/**
 * STORAGE_DRIVER=local (default) stores files under UPLOADS_DIR (default ./uploads).
 * To go to production on a serverless host, implement an S3 / Vercel Blob driver
 * with the same interface in this folder and select it here.
 */
export function getStorage(): StorageDriver {
  if (driver) return driver;
  const kind = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  switch (kind) {
    case "local": {
      // Local disk is a dev-only driver; keep it out of output file tracing.
      const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOADS_DIR || "uploads");
      driver = new LocalDiskStorage(root);
      return driver;
    }
    default:
      throw new Error(
        `STORAGE_DRIVER="${kind}" is not implemented yet. Add a driver in src/lib/storage/ (see README).`
      );
  }
}

export function mediaUrl(key: string | null | undefined): string | null {
  return key ? getStorage().url(key) : null;
}
