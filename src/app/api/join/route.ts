import { NextResponse } from "next/server";
import { getAppUrl, getStripe, stripeConfigured } from "@/lib/stripe";
import { validateJoinPayload } from "@/lib/join-schema";
import { recordJoin, saveStripeCustomerId } from "@/lib/join-service";
import { getStripePriceId, getTier, isFreeTier } from "@/lib/tiers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = validateJoinPayload(body);
  if (!validated.ok) {
    return NextResponse.json(
      { error: validated.errors[0]?.message ?? "Validation failed", errors: validated.errors },
      { status: 400 }
    );
  }

  const { name, email, phone, tier, note } = validated.data;
  const tierDef = getTier(tier)!;

  try {
    const appUrl = getAppUrl(request);

    // In production a paid tier must never be recorded without checkout.
    if (!stripeConfigured() && process.env.NODE_ENV === "production" && !isFreeTier(tier)) {
      console.error("[join] STRIPE_SECRET_KEY is not set in production; cannot start checkout.");
      return NextResponse.json(
        { error: "Online payments are not available right now. Please try again later." },
        { status: 503 }
      );
    }

    // 1. Create or link the member account in the registry.
    const user = await recordJoin(validated.data);

    // 2. Without Stripe keys: skip Stripe entirely (local dev only).
    if (!stripeConfigured()) {
      console.warn("[join] STRIPE_SECRET_KEY not set; skipping Stripe (dev mode).");
      if (isFreeTier(tier)) {
        const params = new URLSearchParams({ tier: tierDef.name, name, email: user.email });
        return NextResponse.json({ type: "free", redirectUrl: `${appUrl}/thank-you?${params}` });
      }
      const params = new URLSearchParams({ dev: "1", tier: tierDef.name, email: user.email });
      return NextResponse.json({ type: "paid", redirectUrl: `${appUrl}/success?${params}` });
    }

    const stripe = getStripe();

    if (isFreeTier(tier)) {
      const customer = await stripe.customers.create({
        name,
        email,
        phone: phone || undefined,
        metadata: {
          tier,
          tier_name: tierDef.name,
          name,
          phone: phone || "",
          note: note || "",
          source: "sov-membership-join",
          membership_type: "free",
          user_id: user.id,
        },
      });
      if (!user.stripeCustomerId) await saveStripeCustomerId(user.id, customer.id);

      const params = new URLSearchParams({ tier: tierDef.name, name, email: user.email });

      return NextResponse.json({
        type: "free",
        customerId: customer.id,
        redirectUrl: `${appUrl}/thank-you?${params.toString()}`,
      });
    }

    const priceId = getStripePriceId(tier);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price is not configured for ${tierDef.name}. Set ${tierDef.priceEnvKey}.`,
        },
        { status: 500 }
      );
    }

    const metadata = {
      tier,
      tier_name: tierDef.name,
      name,
      phone: phone || "",
      note: note || "",
      source: "sov-membership-join",
      user_id: user.id,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      client_reference_id: user.id,
      metadata,
      subscription_data: { metadata },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe Checkout Session was created without a URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      type: "paid",
      sessionId: session.id,
      redirectUrl: session.url,
    });
  } catch (err) {
    console.error("Join API error:", err);
    return NextResponse.json(
      { error: "Unable to process membership right now. Please try again." },
      { status: 500 }
    );
  }
}
