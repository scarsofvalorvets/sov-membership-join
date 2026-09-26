import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { unreadCount } from "@/lib/messaging";

export const runtime = "nodejs";

/** Unread DM count for the header badge (refreshed on client navigation). */
export async function GET() {
  const session = await auth();
  const id = session?.user?.id;
  const count = id ? await unreadCount(id) : 0;
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
