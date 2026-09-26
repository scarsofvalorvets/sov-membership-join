import { test } from "node:test";
import assert from "node:assert/strict";
import { audienceFor, canViewProfile, directoryWhere, rosterProfileWhere, visibleSections, type ProfilePrivacy } from "./visibility";

const base: ProfilePrivacy = {
  visibility: "members",
  publicPhoto: false,
  publicService: false,
  publicYears: false,
  publicBio: false,
  publicLocation: false,
  publicUnits: false,
  publicDeployments: false,
  publicAwards: false,
};

test("audienceFor distinguishes self, admin, member, public", () => {
  assert.equal(audienceFor(null, "u1"), "public");
  assert.equal(audienceFor({ id: "u1", role: "member" }, "u1"), "self");
  assert.equal(audienceFor({ id: "a", role: "admin" }, "u1"), "admin");
  assert.equal(audienceFor({ id: "u2", role: "member" }, "u1"), "member");
});

test("members-only (default) profiles require sign-in", () => {
  assert.equal(canViewProfile(base, false, "public"), false);
  assert.equal(canViewProfile(base, false, "member"), true);
});

test("hidden profiles are only visible to owner and admins", () => {
  const hidden = { ...base, visibility: "hidden" };
  assert.equal(canViewProfile(hidden, false, "member"), false);
  assert.equal(canViewProfile(hidden, false, "public"), false);
  assert.equal(canViewProfile(hidden, false, "self"), true);
  assert.equal(canViewProfile(hidden, false, "admin"), true);
});

test("admin-hidden overrides a public profile", () => {
  const pub = { ...base, visibility: "public" };
  assert.equal(canViewProfile(pub, false, "public"), true);
  assert.equal(canViewProfile(pub, true, "public"), false);
  assert.equal(canViewProfile(pub, true, "member"), false);
  assert.equal(canViewProfile(pub, true, "self"), true);
});

test("public audience only sees opted-in sections; members see all", () => {
  const pub = { ...base, visibility: "public", publicService: true };
  const s = visibleSections(pub, "public");
  assert.deepEqual(
    Object.entries(s).filter(([, v]) => v).map(([k]) => k),
    ["service"]
  );
  assert.ok(Object.values(visibleSections(pub, "member")).every(Boolean));
});

test("directory: signed-out visitors only match public profiles", () => {
  const w = directoryWhere({}, null) as { AND: object[] };
  assert.deepEqual(w.AND[0], { visibility: { in: ["public"] } });
  const signedIn = directoryWhere({}, { id: "me", role: "member" }) as { AND: object[] };
  assert.deepEqual(signedIn.AND[0], { visibility: { in: ["members", "public"] } });
  assert.ok(JSON.stringify(signedIn).includes('"not":"me"'));
});

test("directory: public filters require the matching public opt-in", () => {
  const w = JSON.stringify(directoryWhere({ state: "TX", branch: "army", unitId: "x", year: 2004 }, null));
  for (const flag of ["publicLocation", "publicService", "publicUnits", "publicYears"]) {
    assert.ok(w.includes(`"${flag}":true`), `expected ${flag}`);
  }
  const member = JSON.stringify(directoryWhere({ state: "TX" }, { id: "me", role: "member" }));
  assert.ok(!member.includes("publicLocation"));
});

test("directory: name search is lower-cased for portable matching", () => {
  const w = JSON.stringify(directoryWhere({ q: "  Example MEMBER " }, { id: "me", role: "member" }));
  assert.ok(w.includes('"contains":"example member"'));
});

test("roster: public viewers need publicUnits opt-in", () => {
  assert.deepEqual(rosterProfileWhere(null), { visibility: "public", publicUnits: true });
  assert.deepEqual(rosterProfileWhere({ id: "x", role: "member" }), { visibility: { in: ["members", "public"] } });
});
