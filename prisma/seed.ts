/**
 * EXAMPLE DATA ONLY — for local development and screenshots.
 *
 * Every person here is fictional ("Example …" names, @example.org emails).
 * Unit names are fictional placeholders. Running this script DELETES all rows
 * in the registry tables first. It refuses to run when NODE_ENV=production.
 *
 * Test logins (dev login or magic link printed to the server console):
 *   admin@example.org   — Example Admin (admin role)
 *   member@example.org  — Example Member (regular member)
 *   jordan@example.org  — Jordan Example (regular member)
 */
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed example data with NODE_ENV=production.");
  process.exit(1);
}

const url = process.env.DATABASE_URL || "file:./dev.db";
const prisma = new PrismaClient({
  adapter: /^postgres(ql)?:\/\//.test(url) ? new PrismaPg({ connectionString: url }) : new PrismaLibSql({ url }),
});

const m = (y: number, mo: number) => new Date(Date.UTC(y, mo - 1, 1));
const lower = (s: string) => s.toLowerCase();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

type SeedMember = {
  key: string;
  email: string;
  name: string;
  role?: "admin" | "member";
  tier: string;
  verified?: boolean;
  profile: {
    branch: string;
    status: string;
    rank?: string;
    specialty?: string;
    start?: number;
    end?: number;
    bio?: string;
    hometown?: string;
    state?: string;
    visibility?: "members" | "public" | "hidden";
    publicAll?: boolean;
  };
};

const MEMBERS: SeedMember[] = [
  {
    key: "admin",
    email: "admin@example.org",
    name: "Example Admin",
    role: "admin",
    tier: "veteran",
    verified: true,
    profile: {
      branch: "army",
      status: "veteran",
      rank: "CPT",
      specialty: "Example admin account",
      start: 2003,
      end: 2011,
      bio: "[Example data] Administrator account for local testing.",
      hometown: "Example City",
      state: "TX",
    },
  },
  {
    key: "member",
    email: "member@example.org",
    name: "Example Member",
    tier: "veteran",
    verified: true,
    profile: {
      branch: "army",
      status: "veteran",
      rank: "SSG",
      specialty: "11B Infantryman",
      start: 2001,
      end: 2009,
      bio: "[Example data] Enlisted out of high school, two deployments with the 1st of the 599th. After the Army I went into logistics and coach youth wrestling. Looking for the guys from 2nd Platoon.",
      hometown: "Example Springs",
      state: "TX",
      visibility: "members",
    },
  },
  {
    key: "jordan",
    email: "jordan@example.org",
    name: "Jordan Example",
    tier: "veteran",
    verified: true,
    profile: {
      branch: "army",
      status: "retired",
      rank: "SFC",
      specialty: "68W Combat Medic",
      start: 1999,
      end: 2019,
      bio: "[Example data] Twenty years as a medic. Now a nursing instructor.",
      hometown: "Example Falls",
      state: "KY",
      visibility: "public",
      publicAll: true,
    },
  },
  { key: "alex", email: "alex@example.org", name: "Alex Example", tier: "first_responder", profile: { branch: "fire", status: "fr_active", rank: "Captain", specialty: "Engine Company Officer", start: 2008, hometown: "Example City", state: "OH", visibility: "public", publicAll: true, bio: "[Example data] Station 7, B shift." } },
  { key: "sam", email: "sam@example.org", name: "Sam Example", tier: "veteran", verified: true, profile: { branch: "marine_corps", status: "veteran", rank: "Sgt", specialty: "0311 Rifleman", start: 2004, end: 2012, state: "CA", bio: "[Example data] Two tours. Semper Fi." } },
  { key: "taylor", email: "taylor@example.org", name: "Taylor Example", tier: "guardian", profile: { branch: "navy", status: "veteran", rank: "HM2", specialty: "Hospital Corpsman", start: 2006, end: 2014, state: "VA" } },
  { key: "casey", email: "casey@example.org", name: "Casey Example", tier: "first_responder", profile: { branch: "law_enforcement", status: "fr_retired", rank: "Sergeant", specialty: "Patrol", start: 1995, end: 2020, state: "IL" } },
  { key: "riley", email: "riley@example.org", name: "Riley Example", tier: "veteran", profile: { branch: "air_force", status: "active", rank: "TSgt", specialty: "Aircraft Maintenance", start: 2012, state: "FL" } },
  { key: "morgan", email: "morgan@example.org", name: "Morgan Example", tier: "first_responder", profile: { branch: "ems", status: "fr_active", rank: "Paramedic", specialty: "Critical Care Transport", start: 2015, state: "TX" } },
  { key: "drew", email: "drew@example.org", name: "Drew Example", tier: "veteran", profile: { branch: "army", status: "veteran", rank: "SPC", specialty: "11B Infantryman", start: 2003, end: 2007, state: "GA", visibility: "public" } },
  { key: "jamie", email: "jamie@example.org", name: "Jamie Example", tier: "community_supporter", profile: { branch: "coast_guard", status: "veteran", rank: "BM1", specialty: "Boatswain's Mate", start: 2000, end: 2010, state: "WA" } },
  { key: "pat", email: "pat@example.org", name: "Pat Example", tier: "veteran", profile: { branch: "national_guard", status: "veteran", rank: "SGT", specialty: "88M Motor Transport", start: 2005, end: 2013, state: "TN" } },
  { key: "chris", email: "chris@example.org", name: "Chris Example", tier: "first_responder", profile: { branch: "dispatch", status: "fr_active", rank: "Telecommunicator", start: 2016, state: "OH" } },
  { key: "robin", email: "robin@example.org", name: "Robin Example", tier: "veteran", profile: { branch: "space_force", status: "active", rank: "Sgt", specialty: "Space Systems Operations", start: 2019, state: "CO" } },
  { key: "quinn", email: "quinn@example.org", name: "Quinn Example", tier: "veteran", profile: { branch: "army", status: "veteran", rank: "SGT", start: 2002, end: 2008, state: "TX", visibility: "hidden", bio: "[Example data] Hidden profile — should never appear in the directory." } },
];

async function main() {
  console.log("Seeding EXAMPLE data (fictional people and units)…");

  // Wipe in dependency order.
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.lookingForPost.deleteMany();
  await prisma.unitPost.deleteMany();
  await prisma.award.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.serviceEntry.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const u: Record<string, string> = {};
  for (const s of MEMBERS) {
    const pub = Boolean(s.profile.publicAll);
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        role: s.role ?? "member",
        tier: s.tier,
        membershipStatus: "active",
        verified: Boolean(s.verified),
        verifiedAt: s.verified ? new Date() : null,
        emailVerified: new Date(),
        joinNote: "[Example data]",
        profile: {
          create: {
            displayName: s.name,
            searchName: lower(s.name),
            branch: s.profile.branch,
            status: s.profile.status,
            rank: s.profile.rank,
            specialty: s.profile.specialty,
            serviceStartYear: s.profile.start,
            serviceEndYear: s.profile.end,
            bio: s.profile.bio,
            hometown: s.profile.hometown,
            state: s.profile.state,
            visibility: s.profile.visibility ?? "members",
            publicPhoto: pub,
            publicService: pub || s.profile.visibility === "public",
            publicYears: pub,
            publicBio: pub,
            publicLocation: pub,
            publicUnits: pub,
            publicDeployments: pub,
            publicAwards: pub,
          },
        },
      },
    });
    u[s.key] = user.id;
  }

  const unit = async (d: {
    name: string;
    branch: string;
    unitType?: string;
    location?: string;
    description?: string;
    parentId?: string;
    status?: string;
    proposedById?: string;
  }) =>
    prisma.unit.create({
      data: {
        ...d,
        searchName: lower([d.name, d.location].filter(Boolean).join(" ")),
        status: d.status ?? "approved",
        reviewedAt: d.status === "pending" ? null : new Date(),
      },
    });

  const brigade = await unit({
    name: "3rd Brigade Combat Team, 599th Infantry Division",
    branch: "army",
    unitType: "Brigade",
    location: "Fort Example, KY",
    description: "[Example data] Fictional brigade used for local testing.",
  });
  const bn = await unit({
    name: "1st Battalion, 599th Infantry Regiment",
    branch: "army",
    unitType: "Battalion",
    location: "Fort Example, KY",
    parentId: brigade.id,
    description:
      "[Example data] Fictional light infantry battalion. \"Always Ready.\" Deployed twice during the mid-2000s. Use this page to find the people you served with and share photos from back then.",
  });
  const coB = await unit({
    name: "B Company, 1-599th Infantry",
    branch: "army",
    unitType: "Company / Battery / Troop",
    location: "Fort Example, KY",
    parentId: bn.id,
    description: "[Example data] Bravo Company.",
  });
  const medBn = await unit({ name: "599th Brigade Support Battalion", branch: "army", unitType: "Battalion", location: "Fort Example, KY", parentId: brigade.id, description: "[Example data] Fictional support battalion." });
  const mar = await unit({ name: "2nd Battalion, 99th Marines", branch: "marine_corps", unitType: "Battalion", location: "Camp Example, CA", description: "[Example data] Fictional Marine infantry battalion." });
  const ship = await unit({ name: "USS Example (DDG-999)", branch: "navy", unitType: "Ship / Boat", location: "Norfolk, VA", description: "[Example data] Fictional destroyer." });
  const fire = await unit({ name: "Example City Fire Department — Station 7", branch: "fire", unitType: "Station / Firehouse", location: "Example City, OH", description: "[Example data] Fictional engine and ladder company." });
  const pd = await unit({ name: "Example County Sheriff's Office", branch: "law_enforcement", unitType: "Agency", location: "Example County, IL", description: "[Example data] Fictional sheriff's office." });
  await unit({ name: "Example Air Wing, 999th Maintenance Group", branch: "air_force", unitType: "Wing / Group", location: "Example AFB, FL", description: "[Example data] Fictional maintenance group." });
  const pending = await unit({
    name: "Example Rescue Squadron (proposed)",
    branch: "coast_guard",
    unitType: "Squadron",
    location: "Example Harbor, WA",
    status: "pending",
    proposedById: u.jamie,
    description: "[Example data] A member-proposed unit waiting for admin approval.",
  });

  const entry = (userKey: string, unitId: string, role: string, s: Date, e?: Date) =>
    prisma.serviceEntry.create({ data: { userId: u[userKey], unitId, role, startDate: s, endDate: e ?? null } });

  await entry("member", bn.id, "Team Leader, 2nd Platoon", m(2001, 6), m(2005, 8));
  await entry("member", coB.id, "Squad Leader", m(2005, 9), m(2009, 5));
  await entry("jordan", bn.id, "Battalion Aid Station Medic", m(2002, 1), m(2006, 12));
  await entry("jordan", medBn.id, "Platoon Sergeant", m(2007, 1), m(2012, 6));
  await entry("drew", bn.id, "Rifleman", m(2003, 4), m(2007, 4));
  await entry("drew", coB.id, "Automatic Rifleman", m(2004, 1), m(2007, 4));
  await entry("admin", bn.id, "Platoon Leader", m(2004, 5), m(2007, 7));
  await entry("quinn", bn.id, "Radio Operator", m(2003, 1), m(2008, 1));
  await entry("pat", medBn.id, "Truck Driver", m(2006, 1), m(2010, 1));
  await entry("sam", mar.id, "Fire Team Leader", m(2004, 7), m(2012, 7));
  await entry("taylor", ship.id, "Corpsman", m(2008, 3), m(2012, 3));
  await entry("alex", fire.id, "Captain, Engine 7", m(2008, 1));
  await entry("chris", fire.id, "Dispatch liaison", m(2016, 1));
  await entry("casey", pd.id, "Patrol Sergeant", m(1995, 1), m(2020, 1));
  await entry("jamie", pending.id, "Coxswain", m(2002, 1), m(2008, 1));

  await prisma.deployment.createMany({
    data: [
      { userId: u.member, location: "Example Province, Iraq", operation: "Operation Iraqi Freedom", startDate: m(2003, 3), endDate: m(2004, 3) },
      { userId: u.member, location: "Example Valley, Afghanistan", operation: "Operation Enduring Freedom", startDate: m(2006, 2), endDate: m(2007, 5) },
      { userId: u.jordan, location: "Example Province, Iraq", operation: "Operation Iraqi Freedom", startDate: m(2003, 3), endDate: m(2004, 3) },
      { userId: u.sam, location: "Example District, Afghanistan", operation: "Operation Enduring Freedom", startDate: m(2009, 11), endDate: m(2010, 6) },
    ],
  });
  await prisma.award.createMany({
    data: [
      { userId: u.member, name: "Bronze Star Medal" },
      { userId: u.member, name: "Army Commendation Medal (2)" },
      { userId: u.member, name: "Combat Infantryman Badge" },
      { userId: u.jordan, name: "Combat Medical Badge" },
      { userId: u.jordan, name: "Meritorious Service Medal" },
      { userId: u.sam, name: "Navy and Marine Corps Achievement Medal" },
    ],
  });

  await prisma.unitPost.createMany({
    data: [
      { unitId: bn.id, authorId: u.jordan, body: "[Example data] Twenty years since we got back. Anyone from the BAS still in touch? Would love to set up a reunion call.", createdAt: hoursAgo(50) },
      { unitId: bn.id, authorId: u.drew, body: "[Example data] Found my old platoon photo from the range at Fort Example. Tag yourself if you're in it.", createdAt: hoursAgo(20) },
      { unitId: bn.id, authorId: u.admin, body: "[Example data] Welcome to the unit wall. Keep it respectful, and don't post anyone's personal contact info. Use messages for that.", createdAt: hoursAgo(5) },
      { unitId: fire.id, authorId: u.alex, body: "[Example data] Station 7 cookout next month. Retirees welcome.", createdAt: hoursAgo(30) },
    ],
  });

  const lf = await prisma.lookingForPost.create({
    data: {
      authorId: u.member,
      unitId: bn.id,
      branch: "army",
      startYear: 2003,
      endYear: 2004,
      title: "Looking for Doc from 2nd Platoon, 2003–2004",
      description: "[Example data] Our platoon medic went by \"Doc R.\" Patched me up outside Example City in '03. Never got to say thank you properly.",
      createdAt: hoursAgo(72),
    },
  });
  await prisma.lookingForPost.createMany({
    data: [
      { authorId: u.sam, branch: "marine_corps", unitText: "2nd Battalion, 99th Marines — Weapons Co.", startYear: 2009, endYear: 2010, title: "Weapons Company, 2009 deployment", description: "[Example data] Trying to track down anyone from the mortar section.", createdAt: hoursAgo(26) },
      { authorId: u.casey, branch: "law_enforcement", unitText: "Example County academy class", startYear: 1995, endYear: 1995, title: "Academy class of '95", description: "[Example data] Putting together a 30-year get-together.", createdAt: hoursAgo(8) },
    ],
  });

  // Conversation: Jordan replies to Example Member's Looking For post (unread for Example Member).
  const convo = await prisma.conversation.create({
    data: {
      pairKey: [u.member, u.jordan].sort().join(":"),
      participants: { create: [{ userId: u.member, lastReadAt: hoursAgo(10) }, { userId: u.jordan, lastReadAt: hoursAgo(1) }] },
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: convo.id, senderId: u.jordan, body: `[Example data] Saw your post "${lf.title}". I was at the BAS in '03. I think I know who Doc R. is.`, createdAt: hoursAgo(12) },
      { conversationId: convo.id, senderId: u.member, body: "[Example data] That would mean a lot. Anything you remember helps.", createdAt: hoursAgo(11) },
      { conversationId: convo.id, senderId: u.jordan, body: "[Example data] He's retired now. I'll ask if he's OK with me passing along his info.", createdAt: hoursAgo(2) },
    ],
  });

  // One open report for the admin queue.
  const reported = await prisma.unitPost.create({
    data: { unitId: fire.id, authorId: u.chris, body: "[Example data] Selling used gear, DM me. (Off-topic example post for the moderation queue.)", createdAt: hoursAgo(3) },
  });
  await prisma.report.create({
    data: { reporterId: u.alex, targetType: "unit_post", targetId: reported.id, reason: "[Example data] Off-topic sales post." },
  });

  console.log(`Seeded ${MEMBERS.length} example members, 10 units (1 pending), posts, messages, and a report.`);
  console.log("Test logins: admin@example.org (admin), member@example.org, jordan@example.org");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
