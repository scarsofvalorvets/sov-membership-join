import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * Serves files from the local storage driver. Keys are random UUIDs, so URLs
 * are not guessable; production drivers (S3/Blob) would serve directly.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[...key]">) {
  const { key } = await ctx.params;
  const obj = await getStorage().get(key.join("/"));
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(obj.data), {
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
