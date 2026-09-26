import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { membershipUpdateFromEvent } from "@/lib/stripe-webhook";

export const runtime = "nodejs";

/**
 * Stripe webhook: marks paid memberships active after Checkout and canceled
 * when a subscription ends. Requires STRIPE_SECRET_KEY and
 * STRIPE_WEBHOOK_SECRET (create the endpoint in the Stripe Dashboard at go-live).
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigured() || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const payload = await request.text();
  let event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const update = membershipUpdateFromEvent(event);
  if (update.kind === "activate") {
    const user =
      (update.userId && (await prisma.user.findUnique({ where: { id: update.userId } }))) ||
      (update.email && (await prisma.user.findUnique({ where: { email: update.email } }))) ||
      null;
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: update.tier,
          membershipStatus: "active",
          stripeCustomerId: update.customerId ?? user.stripeCustomerId,
        },
      });
    } else {
      console.warn("[stripe webhook] no member found for checkout session", event.id);
    }
  } else if (update.kind === "cancel") {
    await prisma.user.updateMany({
      where: { stripeCustomerId: update.customerId },
      data: { membershipStatus: "canceled" },
    });
  }

  return NextResponse.json({ received: true });
}
