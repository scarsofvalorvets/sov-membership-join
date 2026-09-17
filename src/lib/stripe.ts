import Stripe from "stripe";

let stripeClient: Stripe | null = null;

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

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }
  return url;
}
