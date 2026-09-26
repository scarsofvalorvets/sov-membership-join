"use client";

import { useEffect } from "react";
import { UNREAD_REFRESH_EVENT } from "@/components/UnreadBadge";

/** Rendered by a thread page after it marks messages read; updates the header badge. */
export default function RefreshUnread() {
  useEffect(() => {
    window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT));
  }, []);
  return null;
}
