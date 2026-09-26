/**
 * Enumerated values stored as plain strings in the database (keeps the Prisma
 * schema portable between SQLite and Postgres). Validate with the helpers below.
 */

export type Option = { id: string; label: string; group: "military" | "first_responder" };

export const BRANCHES: Option[] = [
  { id: "army", label: "Army", group: "military" },
  { id: "navy", label: "Navy", group: "military" },
  { id: "air_force", label: "Air Force", group: "military" },
  { id: "marine_corps", label: "Marine Corps", group: "military" },
  { id: "coast_guard", label: "Coast Guard", group: "military" },
  { id: "space_force", label: "Space Force", group: "military" },
  { id: "national_guard", label: "National Guard", group: "military" },
  { id: "reserves", label: "Reserves", group: "military" },
  { id: "law_enforcement", label: "Law Enforcement", group: "first_responder" },
  { id: "fire", label: "Fire", group: "first_responder" },
  { id: "ems", label: "EMS", group: "first_responder" },
  { id: "dispatch", label: "Dispatch", group: "first_responder" },
  { id: "corrections", label: "Corrections", group: "first_responder" },
  { id: "other_responder", label: "Other First Responder", group: "first_responder" },
];

export const SERVICE_STATUSES = [
  { id: "veteran", label: "Veteran" },
  { id: "active", label: "Active Duty" },
  { id: "retired", label: "Retired (Military)" },
  { id: "fr_active", label: "First Responder — Active" },
  { id: "fr_retired", label: "First Responder — Retired" },
] as const;

export const VISIBILITY_OPTIONS = [
  {
    id: "members",
    label: "Members only",
    help: "Signed-in SoV members can see your service record. Default.",
  },
  {
    id: "public",
    label: "Public",
    help: "Anyone can see your display name plus only the fields you opt in below.",
  },
  {
    id: "hidden",
    label: "Hidden",
    help: "Only you (and SoV admins) can see your record. You will not appear in the directory or unit rosters.",
  },
] as const;

export type Visibility = (typeof VISIBILITY_OPTIONS)[number]["id"];

export const UNIT_TYPES = [
  "Division",
  "Brigade",
  "Regiment",
  "Battalion",
  "Squadron",
  "Company / Battery / Troop",
  "Platoon",
  "Wing / Group",
  "Ship / Boat",
  "Detachment",
  "Department",
  "Precinct / District",
  "Station / Firehouse",
  "Agency",
  "Other",
];

export const US_STATES: { id: string; label: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
  ["PR", "Puerto Rico"], ["GU", "Guam"], ["VI", "U.S. Virgin Islands"],
  ["AS", "American Samoa"], ["MP", "Northern Mariana Islands"], ["AE", "Armed Forces Europe"],
  ["AP", "Armed Forces Pacific"], ["AA", "Armed Forces Americas"],
].map(([id, label]) => ({ id, label }));

export const REPORT_TARGETS = ["message", "unit_post", "looking_for", "profile"] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];

const branchIds = new Set(BRANCHES.map((b) => b.id));
const statusIds = new Set<string>(SERVICE_STATUSES.map((s) => s.id));
const visibilityIds = new Set<string>(VISIBILITY_OPTIONS.map((v) => v.id));
const stateIds = new Set(US_STATES.map((s) => s.id));

export const isBranch = (v: unknown): v is string => typeof v === "string" && branchIds.has(v);
export const isStatus = (v: unknown): v is string => typeof v === "string" && statusIds.has(v);
export const isVisibility = (v: unknown): v is Visibility =>
  typeof v === "string" && visibilityIds.has(v);
export const isState = (v: unknown): v is string => typeof v === "string" && stateIds.has(v);
export const isReportTarget = (v: unknown): v is ReportTarget =>
  typeof v === "string" && (REPORT_TARGETS as readonly string[]).includes(v);

export function branchLabel(id: string | null | undefined): string {
  return BRANCHES.find((b) => b.id === id)?.label ?? "";
}
export function statusLabel(id: string | null | undefined): string {
  return SERVICE_STATUSES.find((s) => s.id === id)?.label ?? "";
}
export function stateLabel(id: string | null | undefined): string {
  return US_STATES.find((s) => s.id === id)?.label ?? "";
}
