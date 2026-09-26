import Link from "next/link";
import type { ReactNode } from "react";
import { initials } from "@/lib/text";

export const inputCls =
  "w-full rounded-lg border border-stone-600 bg-stone-900/80 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 outline-none ring-amber-500/40 transition focus:border-amber-500 focus:ring-2";
export const labelCls = "mb-1 block text-sm font-medium text-stone-200";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 shadow shadow-amber-900/30 transition hover:bg-amber-400 disabled:opacity-60";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-stone-600 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-100 transition hover:border-amber-500 hover:text-amber-300";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-900/50";
export const btnGhost =
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-400 transition hover:bg-stone-800 hover:text-stone-100";
export const cardCls = "rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5 sm:p-6";

export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-stone-50 sm:text-3xl">{title}</h1>
        {children ? <div className="mt-2 text-sm leading-relaxed text-stone-400 sm:text-base">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Container({ children, narrow }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto ${narrow ? "max-w-3xl" : "max-w-6xl"} px-4 py-8 sm:px-6 sm:py-12`}>{children}</div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`${cardCls} ${className}`}>{children}</section>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">{children}</h2>
      {aside}
    </div>
  );
}

export function Badge({
  children,
  tone = "stone",
}: {
  children: ReactNode;
  tone?: "stone" | "gold" | "green" | "blue" | "red";
}) {
  const tones = {
    stone: "border-stone-600 bg-stone-800/60 text-stone-300",
    gold: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    blue: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    red: "border-red-500/40 bg-red-500/10 text-red-300",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <Badge tone="gold">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
        <path d="M10 1l2.4 2.1 3.2-.3.7 3.1 2.7 1.8-1.3 2.9 1.3 2.9-2.7 1.8-.7 3.1-3.2-.3L10 21l-2.4-2.1-3.2.3-.7-3.1L1 14.3l1.3-2.9L1 8.5l2.7-1.8.7-3.1 3.2.3L10 1zm-1.2 12.3l5.3-5.3-1.2-1.2-4.1 4.1-2-2-1.2 1.2 3.2 3.2z" />
      </svg>
      Verified
    </Badge>
  );
}

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-20 w-20 text-xl", xl: "h-28 w-28 text-3xl" };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${sizes[size]} shrink-0 rounded-full border border-stone-600 object-cover`}
      />
    );
  }
  return (
    <span
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-gradient-to-br from-blue-950 to-stone-900 font-semibold text-amber-300`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-700 p-8 text-center">
      <p className="font-medium text-stone-200">{title}</p>
      {children ? <div className="mt-2 text-sm text-stone-400">{children}</div> : null}
    </div>
  );
}

const NOTICES: Record<string, { tone: "ok" | "err"; text: string }> = {
  saved: { tone: "ok", text: "Saved." },
  added: { tone: "ok", text: "Added." },
  removed: { tone: "ok", text: "Removed." },
  posted: { tone: "ok", text: "Posted." },
  sent: { tone: "ok", text: "Message sent." },
  proposed: { tone: "ok", text: "Unit submitted. An admin will review it before it appears publicly." },
  reported: { tone: "ok", text: "Report received. An admin will review it. Thank you." },
  blocked: { tone: "ok", text: "Member blocked. They can no longer message you." },
  unblocked: { tone: "ok", text: "Member unblocked." },
  closed: { tone: "ok", text: "Post closed." },
  blocked_dm: { tone: "err", text: "You can't message this member." },
  invalid: { tone: "err", text: "Check the form and try again." },
  photo_error: { tone: "err", text: "Photo must be a JPEG, PNG, or WebP image, 5 MB or smaller." },
  not_found: { tone: "err", text: "That item was not found." },
};

export function Notice({ code, text }: { code?: string | null; text?: string | null }) {
  const n = code ? NOTICES[code] : null;
  const message = text || n?.text;
  if (!message) return null;
  const err = n?.tone === "err";
  return (
    <div
      role={err ? "alert" : "status"}
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        err ? "border-red-500/40 bg-red-950/50 text-red-200" : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
      }`}
    >
      {message}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-2 text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link className={btnSecondary} href={hrefFor(page - 1)}>
          ← Previous
        </Link>
      ) : null}
      <span className="px-3 text-stone-400">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link className={btnSecondary} href={hrefFor(page + 1)}>
          Next →
        </Link>
      ) : null}
    </nav>
  );
}
