const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Parse an <input type="month"> value ("YYYY-MM") into a UTC Date (1st of month). */
export function parseMonth(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

export function toMonthInput(date: Date | null | undefined): string {
  if (!date) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(date: Date | null | undefined): string {
  if (!date) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatRange(start: Date | null | undefined, end: Date | null | undefined): string {
  const s = formatMonth(start);
  const e = end ? formatMonth(end) : start ? "Present" : "";
  if (!s && !e) return "";
  return `${s || "?"} – ${e}`;
}

export function formatYears(start: number | null | undefined, end: number | null | undefined): string {
  if (!start && !end) return "";
  if (start && end && start === end) return String(start);
  return `${start ?? "?"} – ${end ?? "Present"}`;
}

export function parseYear(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const n = Number(String(value).trim());
  if (!Number.isInteger(n) || n < 1900 || n > 2100) return null;
  return n;
}

export function timeAgo(date: Date, now: Date = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatMonth(date);
}
