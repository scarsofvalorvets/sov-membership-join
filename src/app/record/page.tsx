import type { Metadata } from "next";
import Link from "next/link";
import {
  addAward,
  addDeployment,
  addServiceEntry,
  deleteAward,
  deleteDeployment,
  deleteServiceEntry,
  removePhoto,
  updateProfile,
} from "@/app/actions/record";
import BranchSelect from "@/components/BranchSelect";
import {
  Avatar,
  Badge,
  Card,
  Container,
  Notice,
  PageHeader,
  SectionTitle,
  VerifiedBadge,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputCls,
  labelCls,
} from "@/components/ui";
import { SERVICE_STATUSES, UNIT_TYPES, US_STATES, VISIBILITY_OPTIONS, branchLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatRange } from "@/lib/dates";
import { ensureProfile } from "@/lib/members";
import { requireUser } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";
import { getTier } from "@/lib/tiers";

export const metadata: Metadata = { title: "My Service Record" };

const PUBLIC_FIELDS = [
  ["publicPhoto", "Photo"],
  ["publicService", "Branch/agency, status, rank, specialty"],
  ["publicYears", "Years of service"],
  ["publicLocation", "Hometown and state"],
  ["publicBio", "Bio / story"],
  ["publicUnits", "Service history (units)"],
  ["publicDeployments", "Deployments / assignments"],
  ["publicAwards", "Awards"],
] as const;

export default async function RecordPage(props: PageProps<"/record">) {
  const sp = await props.searchParams;
  const user = await requireUser("/record");
  const profile = await ensureProfile(user.id, user.name ?? "");

  const [entries, deployments, awards, units] = await Promise.all([
    prisma.serviceEntry.findMany({
      where: { userId: user.id },
      include: { unit: true },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.deployment.findMany({ where: { userId: user.id }, orderBy: [{ startDate: "desc" }] }),
    prisma.award.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
    prisma.unit.findMany({
      where: { OR: [{ status: "approved" }, { status: "pending", proposedById: user.id }] },
      select: { id: true, name: true, branch: true, location: true, status: true },
      orderBy: [{ branch: "asc" }, { name: "asc" }],
    }),
  ]);

  const tier = user.tier ? getTier(user.tier) : null;
  const photo = mediaUrl(profile.photoKey);
  const unitsByBranch = new Map<string, typeof units>();
  for (const u of units) {
    const list = unitsByBranch.get(u.branch) ?? [];
    list.push(u);
    unitsByBranch.set(u.branch, list);
  }

  return (
    <Container>
      <PageHeader
        eyebrow="My Service Record"
        title={profile.displayName}
        actions={
          <Link href={`/members/${user.id}`} className={btnSecondary}>
            View my profile
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {tier ? (
            <Badge tone="gold">
              {tier.name} member{user.membershipStatus === "pending_payment" ? " · payment pending" : ""}
            </Badge>
          ) : (
            <Badge>No membership tier</Badge>
          )}
          {user.verified ? <VerifiedBadge /> : <Badge>Not yet verified</Badge>}
          <Badge tone="blue">
            Visibility: {VISIBILITY_OPTIONS.find((v) => v.id === profile.visibility)?.label ?? "Members only"}
          </Badge>
        </div>
      </PageHeader>

      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <SectionTitle>Profile</SectionTitle>
            <form action={updateProfile} className="space-y-5" id="profile-form">
              <div className="flex items-center gap-4">
                <Avatar name={profile.displayName} src={photo} size="lg" />
                <label className="block flex-1">
                  <span className={labelCls}>Photo</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-stone-400 file:mr-3 file:rounded-md file:border-0 file:bg-stone-800 file:px-3 file:py-1.5 file:text-sm file:text-stone-100 hover:file:bg-stone-700"
                  />
                  <span className="mt-1 block text-xs text-stone-500">JPEG, PNG, or WebP up to 5 MB.</span>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Display name *</span>
                  <input className={inputCls} name="displayName" required minLength={2} maxLength={80} defaultValue={profile.displayName} />
                </label>
                <label className="block">
                  <span className={labelCls}>Branch or agency</span>
                  <BranchSelect name="branch" defaultValue={profile.branch} />
                </label>
                <label className="block">
                  <span className={labelCls}>Status</span>
                  <select name="status" defaultValue={profile.status ?? ""} className={inputCls}>
                    <option value="">Select status</option>
                    {SERVICE_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelCls}>Rank / title</span>
                  <input className={inputCls} name="rank" maxLength={80} defaultValue={profile.rank ?? ""} placeholder="SSG, Captain, Lieutenant…" />
                </label>
                <label className="block">
                  <span className={labelCls}>MOS / rating / specialty</span>
                  <input className={inputCls} name="specialty" maxLength={120} defaultValue={profile.specialty ?? ""} placeholder="11B Infantry, HM Corpsman, Paramedic…" />
                </label>
                <label className="block">
                  <span className={labelCls}>Service start (year)</span>
                  <input className={inputCls} name="serviceStartYear" inputMode="numeric" pattern="\d{4}" defaultValue={profile.serviceStartYear ?? ""} placeholder="1998" />
                </label>
                <label className="block">
                  <span className={labelCls}>Service end (year)</span>
                  <input className={inputCls} name="serviceEndYear" inputMode="numeric" pattern="\d{4}" defaultValue={profile.serviceEndYear ?? ""} placeholder="Leave blank if still serving" />
                </label>
                <label className="block">
                  <span className={labelCls}>Hometown</span>
                  <input className={inputCls} name="hometown" maxLength={80} defaultValue={profile.hometown ?? ""} />
                </label>
                <label className="block">
                  <span className={labelCls}>State</span>
                  <select name="state" defaultValue={profile.state ?? ""} className={inputCls}>
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Bio / story</span>
                  <textarea className={`${inputCls} min-h-32`} name="bio" maxLength={4000} defaultValue={profile.bio ?? ""} placeholder="Where you served, who you served with, what you want people to know." />
                </label>
              </div>

              <fieldset className="rounded-xl border border-stone-700 p-4">
                <legend className="px-1 text-sm font-semibold text-stone-100">Who can see this record</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {VISIBILITY_OPTIONS.map((v) => (
                    <label key={v.id} className="flex cursor-pointer gap-2 rounded-lg border border-stone-700 bg-stone-900/60 p-3 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-500/10">
                      <input type="radio" name="visibility" value={v.id} defaultChecked={profile.visibility === v.id} className="mt-0.5 accent-amber-500" />
                      <span>
                        <span className="block text-sm font-medium text-stone-100">{v.label}</span>
                        <span className="block text-xs text-stone-400">{v.help}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm font-medium text-stone-200">Show publicly (only applies when visibility is Public)</p>
                <p className="text-xs text-stone-500">
                  Off by default. Signed-out visitors see your display name and only the items you check. Email and phone are never shown to anyone.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {PUBLIC_FIELDS.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-stone-300">
                      <input type="checkbox" name={key} defaultChecked={profile[key]} className="h-4 w-4 accent-amber-500" />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button type="submit" className={btnPrimary}>
                Save profile
              </button>
            </form>
            {profile.photoKey ? (
              <form action={removePhoto} className="mt-3">
                <button type="submit" className={btnGhost}>
                  Remove photo
                </button>
              </form>
            ) : null}
          </Card>

          <Card>
            <div id="history" className="scroll-mt-24" />
            <SectionTitle>Service history</SectionTitle>
            {entries.length ? (
              <ul className="mb-6 divide-y divide-stone-800">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <Link href={`/units/${e.unit.id}`} className="font-medium text-stone-100 hover:text-amber-300">
                        {e.unit.name}
                      </Link>
                      {e.unit.status === "pending" ? (
                        <span className="ml-2">
                          <Badge tone="gold">Pending review</Badge>
                        </span>
                      ) : null}
                      <p className="text-sm text-stone-400">
                        {[branchLabel(e.unit.branch), e.role, formatRange(e.startDate, e.endDate)].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <form action={deleteServiceEntry}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className={btnGhost} aria-label={`Remove ${e.unit.name}`}>
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-6 text-sm text-stone-400">No units yet. Add where you served so others can find you on the unit roster.</p>
            )}

            <form action={addServiceEntry} className="space-y-4 rounded-xl border border-stone-700 bg-stone-950/40 p-4">
              <p className="text-sm font-semibold text-stone-100">Add a unit</p>
              <label className="block">
                <span className={labelCls}>Unit</span>
                <select name="unitId" className={inputCls} defaultValue="">
                  <option value="">Select a unit (or propose one below)</option>
                  {[...unitsByBranch.entries()].map(([branch, list]) => (
                    <optgroup key={branch} label={branchLabel(branch)}>
                      {list.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                          {u.location ? ` — ${u.location}` : ""}
                          {u.status === "pending" ? " (pending)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <details className="rounded-lg border border-stone-700 p-3">
                <summary className="cursor-pointer text-sm font-medium text-amber-400">Unit not listed? Propose a new one</summary>
                <p className="mt-2 text-xs text-stone-500">New units show as pending until an SoV admin approves them. Leave the unit dropdown empty to use this.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={labelCls}>Unit name</span>
                    <input className={inputCls} name="newUnitName" maxLength={120} placeholder="e.g. 2nd Battalion, 7th Marines" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Branch or agency</span>
                    <BranchSelect name="newUnitBranch" />
                  </label>
                  <label className="block">
                    <span className={labelCls}>Type</span>
                    <select name="newUnitType" className={inputCls} defaultValue="">
                      <option value="">Select type</option>
                      {UNIT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className={labelCls}>Location</span>
                    <input className={inputCls} name="newUnitLocation" maxLength={120} placeholder="Base, city, or station" />
                  </label>
                </div>
              </details>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className={labelCls}>Role</span>
                  <input className={inputCls} name="role" maxLength={120} placeholder="Squad Leader" />
                </label>
                <label className="block">
                  <span className={labelCls}>From</span>
                  <input className={inputCls} type="month" name="startDate" />
                </label>
                <label className="block">
                  <span className={labelCls}>To</span>
                  <input className={inputCls} type="month" name="endDate" />
                </label>
              </div>
              <button type="submit" className={btnSecondary}>
                Add to service history
              </button>
            </form>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div id="deployments" className="scroll-mt-24" />
              <SectionTitle>Deployments &amp; assignments</SectionTitle>
              <ul className="mb-4 divide-y divide-stone-800">
                {deployments.map((d) => (
                  <li key={d.id} className="flex items-start justify-between gap-2 py-2">
                    <div>
                      <p className="text-sm font-medium text-stone-100">{d.location}</p>
                      <p className="text-xs text-stone-400">{[d.operation, formatRange(d.startDate, d.endDate)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <form action={deleteDeployment}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className={btnGhost}>Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={addDeployment} className="space-y-3">
                <input className={inputCls} name="location" required maxLength={120} placeholder="Location (required)" aria-label="Location" />
                <input className={inputCls} name="operation" maxLength={120} placeholder="Operation name (optional)" aria-label="Operation name" />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputCls} type="month" name="startDate" aria-label="From" />
                  <input className={inputCls} type="month" name="endDate" aria-label="To" />
                </div>
                <button type="submit" className={btnSecondary}>Add deployment</button>
              </form>
            </Card>

            <Card>
              <div id="awards" className="scroll-mt-24" />
              <SectionTitle>Awards</SectionTitle>
              <ul className="mb-4 space-y-1">
                {awards.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 text-sm text-stone-200">
                    <span>{a.name}</span>
                    <form action={deleteAward}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className={btnGhost}>Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={addAward} className="flex gap-2">
                <input className={inputCls} name="name" required maxLength={160} placeholder="e.g. Bronze Star Medal" aria-label="Award" />
                <button type="submit" className={btnSecondary}>Add</button>
              </form>
            </Card>
          </div>
        </div>

        <aside className="space-y-6">
          <Card>
            <SectionTitle>Privacy</SectionTitle>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>Your email and phone are never shown to other members.</li>
              <li>We never ask for your SSN or discharge paperwork.</li>
              <li>&quot;Verified&quot; is set by an SoV admin after an offline conversation. No uploads.</li>
              <li>Members-only is the default. Public fields are opt-in, one by one.</li>
            </ul>
          </Card>
          <Card>
            <SectionTitle>Account</SectionTitle>
            <p className="text-sm text-stone-400">Name, phone, and blocked members are managed in account settings.</p>
            <Link href="/account" className={`${btnSecondary} mt-3`}>
              Account settings
            </Link>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
