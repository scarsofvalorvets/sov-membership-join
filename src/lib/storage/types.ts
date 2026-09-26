export type StoredObject = { data: Buffer; contentType: string };

/**
 * Minimal storage interface so uploads can move from local disk (dev) to
 * S3 / Vercel Blob / R2 in production without touching feature code.
 */
export interface StorageDriver {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
  /** URL the browser should use to load the object. */
  url(key: string): string;
}
