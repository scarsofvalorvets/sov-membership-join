import { prisma } from "@/lib/db";
import { searchNameFor } from "@/lib/members";
import type { JoinPayload } from "@/lib/join-schema";
import { getTier } from "@/lib/tiers";

/**
 * Create or link the member account for a Join submission.
 *
 * - New email: create User (+ default members-only Profile). Free tiers are
 *   active immediately; paid tiers are "pending_payment" until Stripe confirms.
 * - Existing email: never overwrite name/phone (someone could type another
 *   person's email). Free tier is applied only if the member has no active
 *   membership. Paid tiers are applied by the Stripe webhook after payment.
 *
 * The response to the browser is the same either way, so the Join form can't
 * be used to discover whether an email is registered.
 */
export async function recordJoin(data: JoinPayload) {
  const email = data.email.trim().toLowerCase();
  const tier = getTier(data.tier)!;
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    return prisma.user.create({
      data: {
        email,
        name: data.name,
        phone: data.phone ?? null,
        joinNote: data.note ?? null,
        tier: tier.id,
        membershipStatus: tier.isFree ? "active" : "pending_payment",
        profile: {
          create: {
            displayName: data.name,
            searchName: searchNameFor(data.name),
            visibility: "members",
          },
        },
      },
    });
  }

  if (tier.isFree && existing.membershipStatus !== "active") {
    return prisma.user.update({
      where: { id: existing.id },
      data: { tier: tier.id, membershipStatus: "active" },
    });
  }
  return existing;
}

export async function saveStripeCustomerId(userId: string, customerId: string) {
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
}
