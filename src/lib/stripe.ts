import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Stripe is optional in local dev. When STRIPE_SECRET_KEY is unset the Join
 * flow records the member locally and skips Stripe entirely (no API calls).
 */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    // Use the SDK default API version for stripe@22
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getAppUrl(request?: Request): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (url) return url;
  // Local dev fallback: derive from the incoming request.
  if (request && process.env.NODE_ENV !== "production") {
    return new URL(request.url).origin;
  }
  throw new Error("NEXT_PUBLIC_APP_URL is not set");
}
