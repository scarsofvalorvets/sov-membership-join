import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setProfileHidden, setVerified } from "@/app/actions/admin";
import { BlockForm, ReportForm } from "@/components/SafetyForms";
import {
  Avatar,
  Badge,
  Card,
  Container,
  EmptyState,
  Notice,
  SectionTitle,
  VerifiedBadge,
  btnPrimary,
  btnSecondary,
} from "@/components/ui";
import { branchLabel, stateLabel, statusLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatRange, formatYears } from "@/lib/dates";
import { getCurrentUser, viewerOf } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";
import { audienceFor, canViewProfile, visibleSections } from "@/lib/visibility";

export const metadata: Metadata = { title: "Service Record" };

export default async function MemberPage(props: PageProps<"/members/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const me = await getCurrentUser();
  const viewer = viewerOf(me);

  const member = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      verified: true,
      adminHidden: true,
      role: true,
      profile: true,
      serviceEntries: {
        where: { unit: { status: "approved" } },
        include: { unit: { select: { id: true, name: true, branch: true } } },
        orderBy: { startDate: "desc" },
      },
      deployments: { orderBy: { startDate: "desc" } },
      awards: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!member || !member.profile) notFound();

  const audience = audienceFor(viewer, member.id);
  const blocked =
    viewer && audience === "member"
      ? (await prisma.block.count({
          where: {
            OR: [
              { blockerId: viewer.id, blockedId: member.id },
              { blockerId: member.id, blockedId: viewer.id },
            ],
          },
        })) > 0
      : false;

  if (!canViewProfile(member.profile, member.adminHidden, audience) || blocked) {
    return (
      <Container narrow>
        <EmptyState title="This service record isn't available.">
          {viewer ? (
            "The member keeps it private, or it isn't available to you."
          ) : (
            <>
              It may be visible to signed-in members.{" "}
              <Link className="text-amber-400 hover:text-amber-300" href={`/signin?next=/members/${id}`}>
                Sign in
              </Link>
            </>
          )}
        </EmptyState>
      </Container>
    );
  }

  const p = member.profile;
  const show = visibleSections(p, audience);
  const service = show.service ? [branchLabel(p.branch), statusLabel(p.status)].filter(Boolean).join(" · ") : "";
  const location = show.location ? [p.hometown, stateLabel(p.state)].filter(Boolean).join(", ") : "";
  const years = show.years ? formatYears(p.serviceStartYear, p.serviceEndYear) : "";
  const returnTo = `/members/${member.id}`;

  return (
    <Container>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      {audience === "self" ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/30 bg-sky-950/30 px-4 py-3 text-sm text-sky-200">
          <span>
            This is how your record looks to signed-in members. Visibility:{" "}
            <strong>{p.visibility === "members" ? "Members only" : p.visibility === "public" ? "Public" : "Hidden"}</strong>.
          </span>
          <Link href="/record" className={btnSecondary}>
            Edit record
          </Link>
        </div>
      ) : null}
      {audience === "admin" && (member.adminHidden || p.visibility === "hidden") ? (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Admin view: this profile is {member.adminHidden ? "hidden by an admin" : "hidden by the member"}.
        </div>
      ) : null}

      <Card className="mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={p.displayName} src={show.photo ? mediaUrl(p.photoKey) : null} size="xl" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-stone-50 sm:text-3xl">
                {show.service && p.rank ? <span className="text-stone-400">{p.rank} </span> : null}
                {p.displayName}
              </h1>
              {member.verified ? <VerifiedBadge /> : null}
            </div>
            {service ? <p className="mt-1 text-amber-300">{service}</p> : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-400">
              {show.service && p.specialty ? <span>{p.specialty}</span> : null}
              {years ? <span>Served {years}</span> : null}
              {location ? <span>{location}</span> : null}
            </div>
          </div>
          {viewer && audience !== "self" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/messages/new?to=${member.id}`} className={btnPrimary}>
                Send message
              </Link>
              <BlockForm userId={member.id} returnTo="/directory" />
              <ReportForm targetType="profile" targetId={member.id} returnTo={returnTo} />
            </div>
          ) : null}
          {!viewer ? (
            <Link href={`/signin?next=/members/${member.id}`} className={btnSecondary}>
              Sign in to message
            </Link>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {show.bio && p.bio ? (
            <Card>
              <SectionTitle>Story</SectionTitle>
              <p className="whitespace-pre-line leading-relaxed text-stone-300">{p.bio}</p>
            </Card>
          ) : null}
          {show.units ? (
            <Card>
              <SectionTitle>Service history</SectionTitle>
              {member.serviceEntries.length ? (
                <ol className="relative space-y-4 border-l border-stone-700 pl-5">
                  {member.serviceEntries.map((e) => (
                    <li key={e.id}>
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-amber-500 bg-stone-950" />
                      <Link href={`/units/${e.unit.id}`} className="font-medium text-stone-100 hover:text-amber-300">
                        {e.unit.name}
                      </Link>
                      <p className="text-sm text-stone-400">
                        {[branchLabel(e.unit.branch), e.role, formatRange(e.startDate, e.endDate)].filter(Boolean).join(" · ")}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-stone-500">No units listed.</p>
              )}
            </Card>
          ) : null}
          {show.deployments && member.deployments.length ? (
            <Card>
              <SectionTitle>Deployments &amp; assignments</SectionTitle>
              <ul className="divide-y divide-stone-800">
                {member.deployments.map((d) => (
                  <li key={d.id} className="py-2">
                    <p className="font-medium text-stone-100">{d.location}</p>
                    <p className="text-sm text-stone-400">
                      {[d.operation, formatRange(d.startDate, d.endDate)].filter(Boolean).join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
        <aside className="space-y-6">
          {show.awards && member.awards.length ? (
            <Card>
              <SectionTitle>Awards</SectionTitle>
              <ul className="space-y-1.5 text-sm text-stone-300">
                {member.awards.map((a) => (
                  <li key={a.id} className="flex gap-2">
                    <span className="text-amber-500">★</span>
                    {a.name}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {audience === "admin" ? (
            <Card className="border-amber-500/40">
              <SectionTitle>Admin</SectionTitle>
              <div className="flex flex-wrap gap-2">
                <form action={setVerified}>
                  <input type="hidden" name="userId" value={member.id} />
                  <input type="hidden" name="verified" value={member.verified ? "false" : "true"} />
                  <button type="submit" className={btnSecondary}>
                    {member.verified ? "Remove verified" : "Mark verified"}
                  </button>
                </form>
                <form action={setProfileHidden}>
                  <input type="hidden" name="userId" value={member.id} />
                  <input type="hidden" name="hidden" value={member.adminHidden ? "false" : "true"} />
                  <button type="submit" className={btnSecondary}>
                    {member.adminHidden ? "Unhide profile" : "Hide profile"}
                  </button>
                </form>
              </div>
              {member.role === "admin" ? <p className="mt-3"><Badge tone="gold">Admin</Badge></p> : null}
            </Card>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}
