import type Stripe from "stripe";
import { getTier } from "@/lib/tiers";

export type MembershipUpdate =
  | { kind: "activate"; userId: string | null; email: string | null; tier: string; customerId: string | null }
  | { kind: "cancel"; customerId: string }
  | { kind: "ignore" };

/** Map a verified Stripe event to a membership change. Pure (no I/O) for testing. */
export function membershipUpdateFromEvent(event: Stripe.Event): MembershipUpdate {
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const tier = s.metadata?.tier;
    if (s.mode !== "subscription" || !tier || !getTier(tier)) return { kind: "ignore" };
    return {
      kind: "activate",
      userId: s.client_reference_id ?? s.metadata?.user_id ?? null,
      email: (s.customer_details?.email ?? s.customer_email ?? null)?.toLowerCase() ?? null,
      tier,
      customerId: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null,
    };
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    return { kind: "cancel", customerId };
  }
  return { kind: "ignore" };
}
