export type TierId =
  | "veteran"
  | "first_responder"
  | "community_supporter"
  | "guardian"
  | "legacy";

export type MembershipTier = {
  id: TierId;
  name: string;
  description: string;
  priceLabel: string;
  annualCents: number | null;
  isFree: boolean;
  priceEnvKey?: string;
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "veteran",
    name: "Veteran",
    description:
      "Complimentary membership for those who have served in the U.S. Armed Forces.",
    priceLabel: "Free",
    annualCents: null,
    isFree: true,
  },
  {
    id: "first_responder",
    name: "First Responder",
    description:
      "Complimentary membership for police, fire, EMS, and other first responders.",
    priceLabel: "Free",
    annualCents: null,
    isFree: true,
  },
  {
    id: "community_supporter",
    name: "Community Supporter",
    description:
      "Stand with Scars of Valor and help sustain programs that honor service and legacy.",
    priceLabel: "$120 / year",
    annualCents: 12000,
    isFree: false,
    priceEnvKey: "STRIPE_PRICE_COMMUNITY_SUPPORTER",
  },
  {
    id: "guardian",
    name: "Guardian",
    description:
      "A deeper commitment to protecting the mission and expanding outreach.",
    priceLabel: "$250 / year",
    annualCents: 25000,
    isFree: false,
    priceEnvKey: "STRIPE_PRICE_GUARDIAN",
  },
  {
    id: "legacy",
    name: "Legacy",
    description:
      "Lead-level annual support that helps secure the foundation's long-term impact.",
    priceLabel: "$500 / year",
    annualCents: 50000,
    isFree: false,
    priceEnvKey: "STRIPE_PRICE_LEGACY",
  },
];

export function getTier(id: string): MembershipTier | undefined {
  return MEMBERSHIP_TIERS.find((t) => t.id === id);
}

export function isFreeTier(id: string): boolean {
  const tier = getTier(id);
  return Boolean(tier?.isFree);
}

/** Resolve Stripe Price ID for a paid tier from env. */
const DEFAULT_PRICE_IDS: Partial<Record<TierId, string>> = {
  community_supporter: "price_1UGVk6LJOUo405o6bzERgjFC",
  guardian: "price_1UGVkBLJOUo405o6Q1SAG0x1",
  legacy: "price_1UGVkGLJOUo405o6vhRZYQlV",
};

export function getStripePriceId(tierId: TierId): string | null {
  const tier = getTier(tierId);
  if (!tier || tier.isFree || !tier.priceEnvKey) return null;
  const value = process.env[tier.priceEnvKey];
  if (value && value.trim()) return value.trim();
  return DEFAULT_PRICE_IDS[tierId] ?? null;
}
