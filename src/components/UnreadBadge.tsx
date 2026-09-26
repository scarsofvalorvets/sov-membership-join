"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const UNREAD_REFRESH_EVENT = "sov:unread-refresh";

/**
 * The header lives in the root layout, which doesn't re-render on client
 * navigation. Re-check the unread count whenever the path changes so the badge
 * clears after a thread is opened.
 */
export default function UnreadBadge({ initial }: { initial: number }) {
  const pathname = usePathname();
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetch("/api/messages/unread", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { count?: number } | null) => {
          if (!cancelled && typeof d?.count === "number") setCount(d.count);
        })
        .catch(() => {});
    };
    refresh();
    // Pages that change the count (e.g. opening a thread) fire this event.
    window.addEventListener(UNREAD_REFRESH_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UNREAD_REFRESH_EVENT, refresh);
    };
  }, [pathname]);

  if (count <= 0) return null;
  return (
    <span
      className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-stone-950"
      aria-label={`${count} unread`}
    >
      {count}
    </span>
  );
}
