import { NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { validateJoinPayload } from "@/lib/join-schema";
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
    const stripe = getStripe();
    const appUrl = getAppUrl();

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
        },
      });

      const params = new URLSearchParams({
        tier: tierDef.name,
        name,
      });

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
      metadata: {
        tier,
        tier_name: tierDef.name,
        name,
        phone: phone || "",
        note: note || "",
        source: "sov-membership-join",
      },
      subscription_data: {
        metadata: {
          tier,
          tier_name: tierDef.name,
          name,
          phone: phone || "",
          note: note || "",
          source: "sov-membership-join",
        },
      },
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
    const message =
      err instanceof Error ? err.message : "Unable to process membership join.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
