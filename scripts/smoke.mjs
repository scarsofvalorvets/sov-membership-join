/**
 * End-to-end smoke test + screenshots for the SoV member registry.
 *
 * Prereqs: seeded DB (`npm run db:seed`), dev server running with
 * AUTH_DEV_LOGIN=true and NO email server / Stripe key configured, its output
 * captured to DEV_LOG so the magic link can be read from the console.
 *
 *   npm run dev > /tmp/sov-dev.log 2>&1 &
 *   DEV_LOG=/tmp/sov-dev.log SHOTS_DIR=./test-results/shots npm run smoke
 *
 * Uses a locally installed Chrome (CHROME_PATH, default /usr/bin/google-chrome).
 * Mutates the local dev DB; re-run `npm run db:seed` to reset.
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = path.resolve(process.env.SHOTS_DIR || "test-results/shots");
const DEV_LOG = process.env.DEV_LOG || "/tmp/sov-dev.log";
const CHROME = process.env.CHROME_PATH || "/usr/bin/google-chrome";
mkdirSync(SHOTS, { recursive: true });

const results = [];
function pass(name) {
  results.push({ name, ok: true });
  console.log(`  ✓ ${name}`);
}
function assert(cond, name) {
  if (!cond) {
    results.push({ name, ok: false });
    console.log(`  ✗ ${name}`);
    throw new Error(`Assertion failed: ${name}`);
  }
  pass(name);
}

const browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
const ctxOpts = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 };

async function shot(page, name) {
  const file = path.join(SHOTS, name);
  await page.waitForLoadState("networkidle");
  // Hide the Next.js dev-mode indicator so screenshots look like production.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: file, fullPage: true, caret: "initial" });
  console.log(`    📸 ${file}`);
}

async function devLogin(page, email) {
  await page.goto(`${BASE}/signin`);
  await page.getByLabel("Seeded account email").fill(email);
  await Promise.all([page.waitForURL(/\/record/), page.getByRole("button", { name: "Sign in", exact: true }).click()]);
}

async function makeAvatarPng(ctx) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 256, height: 256 });
  await p.setContent(`<body style="margin:0"><div style="width:256px;height:256px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#172554,#0c0a09);color:#fbbf24;font:700 96px system-ui">EM</div></body>`);
  const file = path.join(tmpdir(), "sov-example-avatar.png");
  await p.screenshot({ path: file });
  await p.close();
  return file;
}

async function optionValue(page, selector, text) {
  return page.$eval(
    selector,
    (el, t) => [...el.options].find((o) => o.textContent.includes(t))?.value ?? "",
    text
  );
}

try {
  // ---------------------------------------------------------------- Home
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE);
    await shot(page, "01-home-join.png");
    await ctx.close();
  }

  // ------------------------------------------------------ Member: record
  console.log("Member: service record, unit, wall, directory, DM");
  let memberId;
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    const avatar = await makeAvatarPng(ctx);
    await devLogin(page, "member@example.org");
    assert((await page.content()).includes("My Service Record"), "seeded member signs in (dev login)");

    await page.getByLabel("MOS / rating / specialty").fill("11B Infantryman / Squad Leader");
    await page.locator('input[name="photo"]').setInputFiles(avatar);
    await Promise.all([page.waitForURL(/notice=saved/), page.getByRole("button", { name: "Save profile" }).click()]);
    assert((await page.content()).includes("11B Infantryman / Squad Leader"), "edit service record saves (incl. photo upload)");
    assert((await page.locator('img[src^="/api/uploads/profiles/"]').count()) > 0, "uploaded photo is served from local storage");

    const val = await optionValue(page, 'select[name="unitId"]', "599th Brigade Support Battalion");
    await page.selectOption('select[name="unitId"]', val);
    await page.locator('form:has(select[name="unitId"]) input[name="role"]').fill("Detail NCO");
    await page.locator('form:has(select[name="unitId"]) input[name="startDate"]').fill("2009-01");
    await page.locator('form:has(select[name="unitId"]) input[name="endDate"]').fill("2009-05");
    await Promise.all([page.waitForURL(/notice=added/), page.getByRole("button", { name: "Add to service history" }).click()]);
    assert((await page.locator("#history ~ ul").innerText()).includes("599th Brigade Support Battalion"), "add unit history entry");

    // Propose a new unit through the same form (goes to pending).
    await page.goto(`${BASE}/record`);
    await page.locator("summary", { hasText: "Unit not listed?" }).click();
    await page.locator('input[name="newUnitName"]').fill("Example Training Company (proposed)");
    await page.selectOption('select[name="newUnitBranch"]', "army");
    await page.locator('input[name="newUnitLocation"]').fill("Fort Example, KY");
    await Promise.all([page.waitForURL(/notice=added/), page.getByRole("button", { name: "Add to service history" }).click()]);
    assert((await page.content()).includes("Pending review"), "propose a new unit (pending until admin approval)");
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "02-service-record-edit.png");

    await page.getByRole("link", { name: "View my profile" }).click();
    await page.waitForURL(/\/members\//);
    memberId = page.url().split("/members/")[1].split(/[?#]/)[0];
    assert((await page.content()).includes("Bronze Star Medal"), "profile page shows service record");
    await shot(page, "03-service-record-profile.png");

    // Unit page + wall post
    await page.goto(`${BASE}/units`);
    await page.getByRole("link", { name: /1st Battalion, 599th Infantry Regiment/ }).first().click();
    await page.waitForURL(/\/units\//);
    const wallText = "[Example data] Just added my time with 2nd Platoon to my record. Good to see familiar names on the roster. Reunion call, anyone?";
    await page.getByLabel("Wall post").fill(wallText);
    await Promise.all([page.waitForURL(/notice=posted/), page.getByRole("button", { name: "Post to wall" }).click()]);
    assert((await page.content()).includes(wallText), "post to unit wall");
    assert((await page.content()).includes("Jordan Example"), "unit roster lists opted-in members");
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot(page, "05-unit-page.png");

    // Directory
    await page.goto(`${BASE}/directory?branch=army`);
    const dir = await page.content();
    assert(dir.includes("Jordan Example") && dir.includes("Drew Example"), "directory search by branch returns members");
    assert(!dir.includes("Quinn Example"), "hidden profile never appears in directory");
    await page.goto(`${BASE}/directory?q=example&state=TX`);
    assert((await page.content()).includes("Morgan Example"), "directory filter by state");
    await page.goto(`${BASE}/directory`);
    await shot(page, "04-directory.png");

    // DM to Jordan
    await page.goto(`${BASE}/directory?q=jordan`);
    await page.getByRole("link", { name: /Jordan Example/ }).first().click();
    await page.waitForURL(/\/members\//);
    await page.getByRole("link", { name: "Send message" }).click();
    await page.waitForURL(/\/messages\//);
    const dm = "[Example data] Thank you for looking into it. Tell Doc there is no pressure. I just want him to know we remember.";
    await page.getByLabel("Message").fill(dm);
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST"),
      page.getByRole("button", { name: /^Send/ }).click(),
    ]);
    await page.waitForLoadState("networkidle");
    assert((await page.content()).includes(dm), "send a direct message");
    await ctx.close();
  }

  // ------------------------------------------------ Jordan: inbox + LF
  console.log("Second member: inbox, Looking For");
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await devLogin(page, "jordan@example.org");
    await page.goto(`${BASE}/messages`);
    const inbox = await page.content();
    assert(inbox.includes("Example Member") && inbox.includes("Thank you for looking into it"), "DM appears in recipient's inbox");
    assert((await page.locator('[aria-label$="unread"]').count()) > 0, "unread count shows in header");
    await shot(page, "06-inbox.png");
    await page.getByRole("link", { name: /Example Member/ }).first().click();
    await page.waitForURL(/\/messages\/.+/);
    await page.waitForLoadState("networkidle");
    await page.waitForFunction(() => !document.querySelector('[aria-label$="unread"]'), null, { timeout: 5000 });
    pass("opening the thread clears the unread badge");
    await shot(page, "07-message-thread.png");

    await page.goto(`${BASE}/looking-for`);
    await page.getByLabel("Headline *").fill("Looking for the 599th BSB motor pool crew, 2008");
    await page.getByLabel("Or type the unit").fill("599th BSB motor pool");
    await page.locator('aside select[name="branch"]').selectOption("army");
    await page.getByLabel("From (year)").fill("2008");
    await page.getByLabel("To (year)").fill("2009");
    await page.getByLabel("What you remember *").fill("[Example data] Trying to find the crew that kept our trucks running. Reply here by message.");
    await Promise.all([page.waitForURL(/notice=posted/), page.getByRole("button", { name: "Post", exact: true }).click()]);
    assert((await page.content()).includes("599th BSB motor pool crew"), "post on the Looking For board");
    await shot(page, "08-looking-for.png");

    // Report a wall post and block a member.
    await page.goto(`${BASE}/units`);
    await page.getByRole("link", { name: /1st Battalion, 599th Infantry Regiment/ }).first().click();
    const post = page.locator("li", { hasText: "Found my old platoon photo" });
    await post.locator("summary", { hasText: "Report" }).click();
    await post.locator('textarea[name="reason"]').fill("[Example data] Smoke-test report.");
    await Promise.all([page.waitForURL(/notice=reported/), post.getByRole("button", { name: "Send report" }).click()]);
    pass("report a wall post");

    await page.goto(`${BASE}/directory?q=casey`);
    await page.getByRole("link", { name: /Casey Example/ }).first().click();
    await page.waitForURL(/\/members\//);
    await Promise.all([page.waitForURL(/notice=blocked/), page.getByRole("button", { name: "Block" }).click()]);
    await page.goto(`${BASE}/looking-for`);
    assert(!(await page.content()).includes("Academy class of"), "blocked member's posts are hidden");
    await page.goto(`${BASE}/directory?q=casey`);
    assert(!(await page.content()).includes("Casey Example"), "blocked member hidden from directory");
    await page.goto(`${BASE}/account`);
    await Promise.all([page.waitForURL(/notice=unblocked/), page.getByRole("button", { name: "Unblock" }).click()]);
    pass("unblock from account settings");
    await ctx.close();
  }

  // --------------------------------------------------------------- Admin
  console.log("Admin");
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await devLogin(page, "admin@example.org");
    await page.goto(`${BASE}/admin`);
    assert((await page.content()).includes("Example Training Company (proposed)"), "admin sees pending units");
    await shot(page, "09-admin-units.png");
    const row = page.locator("li", { hasText: "Example Training Company (proposed)" });
    await Promise.all([page.waitForURL(/notice=saved/), row.getByRole("button", { name: "Approve" }).first().click()]);
    assert(!(await page.locator("li", { hasText: "Example Training Company (proposed)" }).getByRole("button", { name: "Approve" }).count()), "admin approves a pending unit");
    await page.goto(`${BASE}/units?q=training`);
    assert((await page.content()).includes("Example Training Company (proposed)"), "approved unit is now listed publicly");

    await page.goto(`${BASE}/admin/reports`);
    assert((await page.content()).includes("Off-topic sales post"), "admin sees open reports");
    assert((await page.content()).includes("Smoke-test report"), "member's report reaches the admin queue");
    await shot(page, "10-admin-reports.png");

    await page.goto(`${BASE}/admin/members?filter=unverified`);
    const vrow = page.locator("tr", { hasText: "Drew Example" });
    await Promise.all([page.waitForURL(/notice=saved/), vrow.getByRole("button", { name: "Verify" }).click()]);
    await page.goto(`${BASE}/admin/members?q=drew`);
    assert((await page.locator("tr", { hasText: "Drew Example" }).getByRole("button", { name: "Unverify" }).count()) === 1, "admin toggles Verified badge");
    await page.goto(`${BASE}/admin/members`);
    await shot(page, "11-admin-members.png");
    await ctx.close();
  }

  // ------------------------------------------------------ Privacy checks
  console.log("Signed-out privacy");
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/directory`);
    const html = await page.content();
    assert(html.includes("Jordan Example") && !html.includes("Example Member<"), "signed-out directory shows public profiles only");
    await page.goto(`${BASE}/members/${memberId}`);
    assert((await page.content()).includes("isn&#x27;t available") || (await page.content()).includes("isn't available"), "members-only profile hidden from signed-out visitors");
    assert(!(await page.content()).includes("@example.org"), "no member emails exposed");
    await ctx.close();
  }
  // ---------------------------------------------------------------- Join
  console.log("Join + magic link");
  {
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();
    await page.goto(BASE);
    const email = `new.member.${Date.now()}@example.org`;
    await page.getByLabel(/Full name/).fill("Example New Member");
    await page.getByLabel(/^Email/).fill(email);
    await page.getByRole("radio", { name: /Veteran/ }).first().check();
    await Promise.all([page.waitForURL(/thank-you/), page.getByRole("button", { name: /Complete free membership/ }).click()]);
    assert(page.url().includes("/thank-you"), "free-tier Join creates account and lands on /thank-you (Stripe skipped)");

    // Paid tier without Stripe keys -> dev success page, no Stripe call.
    await page.goto(BASE);
    await page.getByLabel(/Full name/).fill("Example Paid Member");
    await page.getByLabel(/^Email/).fill(`paid.${Date.now()}@example.org`);
    await page.getByRole("radio", { name: /Guardian/ }).check();
    await Promise.all([page.waitForURL(/success/), page.getByRole("button", { name: /Continue to secure checkout/ }).click()]);
    assert((await page.content()).includes("Stripe is not configured"), "paid-tier Join skips Stripe in dev and records payment pending");

    // Magic link: request, read link from dev server console, follow it.
    await page.goto(`${BASE}/signin?email=${encodeURIComponent(email)}`);
    await Promise.all([
      page.waitForURL(/check-email/),
      page.getByRole("button", { name: "Email me a sign-in link" }).click(),
    ]);
    let link = null;
    for (let i = 0; i < 20 && !link; i++) {
      const log = existsSync(DEV_LOG) ? readFileSync(DEV_LOG, "utf8") : "";
      const idx = log.lastIndexOf(`Magic sign-in link for ${email}`);
      if (idx >= 0) link = log.slice(idx).split("\n")[1]?.trim();
      if (!link) await page.waitForTimeout(250);
    }
    assert(Boolean(link && link.includes("/api/auth/callback/email")), "magic link printed to server console (no email sent)");
    await page.goto(link);
    await page.waitForURL(/\/record/);
    assert((await page.content()).includes("Example New Member"), "magic link signs the new member in to My Service Record");
    await ctx.close();
  }

} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed.`);
}
