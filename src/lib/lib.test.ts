import { test } from "node:test";
import assert from "node:assert/strict";
import { validateJoinPayload } from "./join-schema";
import { detectImage } from "./storage/images";
import { isSafeKey } from "./storage/local";
import { pairKey } from "./pair-key";
import { formatRange, parseMonth, parseYear, toMonthInput } from "./dates";
import { membershipUpdateFromEvent } from "./stripe-webhook";
import { getStripePriceId } from "./tiers";

test("join validation keeps working", () => {
  const ok = validateJoinPayload({ name: "Example Member", email: "member@example.org", tier: "veteran" });
  assert.equal(ok.ok, true);
  const bad = validateJoinPayload({ name: "E", email: "nope", tier: "x" });
  assert.equal(bad.ok, false);
});

test("paid tiers keep their live Stripe price IDs; free tiers have none", () => {
  assert.equal(getStripePriceId("veteran"), null);
  assert.match(getStripePriceId("guardian") ?? "", /^price_/);
});

test("image detection uses magic bytes", () => {
  assert.equal(detectImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext, "jpg");
  assert.equal(detectImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext, "png");
  assert.equal(detectImage(new TextEncoder().encode("<svg onload=alert(1)>")), null);
});

test("storage keys reject path traversal", () => {
  assert.equal(isSafeKey("profiles/3f1c-aa.jpg"), true);
  assert.equal(isSafeKey("../etc/passwd"), false);
  assert.equal(isSafeKey("profiles/../../x.jpg"), false);
  assert.equal(isSafeKey("profiles/x.svg"), false);
});

test("pairKey is order-independent", () => {
  assert.equal(pairKey("b", "a"), pairKey("a", "b"));
});

test("month/year parsing", () => {
  const d = parseMonth("2004-03");
  assert.equal(toMonthInput(d), "2004-03");
  assert.equal(parseMonth("2004-13"), null);
  assert.equal(parseYear("1850"), null);
  assert.equal(parseYear("2001"), 2001);
  assert.equal(formatRange(parseMonth("2003-03"), null), "Mar 2003 – Present");
});

test("stripe webhook mapping (no network)", () => {
  const evt = {
    type: "checkout.session.completed",
    data: {
      object: {
        mode: "subscription",
        metadata: { tier: "guardian", user_id: "u1" },
        client_reference_id: "u1",
        customer: "cus_123",
        customer_details: { email: "A@Example.org" },
      },
    },
  } as never;
  assert.deepEqual(membershipUpdateFromEvent(evt), {
    kind: "activate",
    userId: "u1",
    email: "a@example.org",
    tier: "guardian",
    customerId: "cus_123",
  });
  assert.deepEqual(membershipUpdateFromEvent({ type: "invoice.paid", data: { object: {} } } as never), { kind: "ignore" });
});
