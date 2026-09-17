import type { TierId } from "./tiers";
import { getTier } from "./tiers";

export type JoinPayload = {
  name: string;
  email: string;
  phone?: string;
  tier: TierId;
  note?: string;
};

export type JoinValidationError = {
  field?: string;
  message: string;
};

export function validateJoinPayload(
  body: unknown
):
  | { ok: true; data: JoinPayload }
  | { ok: false; errors: JoinValidationError[] } {
  const errors: JoinValidationError[] = [];

  if (!body || typeof body !== "object") {
    return { ok: false, errors: [{ message: "Invalid request body" }] };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const phone =
    typeof raw.phone === "string" && raw.phone.trim()
      ? raw.phone.trim()
      : undefined;
  const tier = typeof raw.tier === "string" ? raw.tier.trim() : "";
  const note =
    typeof raw.note === "string" && raw.note.trim()
      ? raw.note.trim()
      : undefined;

  if (!name || name.length < 2) {
    errors.push({ field: "name", message: "Please enter your full name." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: "email", message: "Please enter a valid email." });
  }

  const tierDef = getTier(tier);
  if (!tierDef) {
    errors.push({ field: "tier", message: "Please select a membership tier." });
  }

  if (errors.length > 0 || !tierDef) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      phone,
      tier: tierDef.id,
      note,
    },
  };
}
