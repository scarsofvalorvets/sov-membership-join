import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { reviewUnit, setContentHidden } from "@/app/actions/admin";
import { postToWall } from "@/app/actions/units";
import MemberCard from "@/components/MemberCard";
import { ReportForm } from "@/components/SafetyForms";
import {
  Avatar,
  Badge,
  Card,
  Container,
  EmptyState,
  Notice,
  PageHeader,
  SectionTitle,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputCls,
} from "@/components/ui";
import { branchLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatRange, timeAgo } from "@/lib/dates";
import { getCurrentUser, viewerOf } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";
import { rosterProfileWhere } from "@/lib/visibility";

export const metadata: Metadata = { title: "Unit" };

export default async function UnitPage(props: PageProps<"/units/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const me = await getCurrentUser();
  const viewer = viewerOf(me);
  const isAdmin = me?.role === "admin";

  const unit = await prisma.unit.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, status: true } },
      children: { where: { status: "approved" }, select: { id: true, name: true }, orderBy: { name: "asc" } },
      proposedBy: { select: { id: true, name: true } },
    },
  });
  if (!unit) notFound();
  const canSeePending = isAdmin || (me && unit.proposedById === me.id);
  if (unit.status !== "approved" && !canSeePending) notFound();

  const blockFilter = viewer
    ? {
        blocksReceived: { none: { blockerId: viewer.id } },
        blocksMade: { none: { blockedId: viewer.id } },
      }
    : {};

  const roster = await prisma.serviceEntry.findMany({
    where: {
      unitId: unit.id,
      user: { adminHidden: false, profile: rosterProfileWhere(viewer), ...blockFilter },
    },
    include: { user: { select: { verified: true, profile: true } } },
    orderBy: [{ startDate: "asc" }],
  });

  const posts = viewer
    ? await prisma.unitPost.findMany({
        where: {
          unitId: unit.id,
          ...(isAdmin ? {} : { hidden: false }),
          author: blockFilter,
        },
        include: { author: { select: { id: true, name: true, verified: true, profile: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  const returnTo = `/units/${unit.id}#wall`;

  return (
    <Container>
      <PageHeader
        eyebrow={branchLabel(unit.branch)}
        title={unit.name}
        actions={
          <Link href={`/directory?unit=${unit.id}`} className={btnSecondary}>
            Search members from this unit
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {unit.unitType ? <Badge>{unit.unitType}</Badge> : null}
          {unit.location ? <Badge>{unit.location}</Badge> : null}
          {unit.status !== "approved" ? (
            <Badge tone={unit.status === "rejected" ? "red" : "gold"}>
              {unit.status === "pending" ? "Pending admin review" : "Not approved"}
            </Badge>
          ) : null}
          {unit.parent && unit.parent.status === "approved" ? (
            <span className="text-sm text-stone-400">
              Part of{" "}
              <Link href={`/units/${unit.parent.id}`} className="text-amber-400 hover:text-amber-300">
                {unit.parent.name}
              </Link>
            </span>
          ) : null}
        </div>
      </PageHeader>

      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />

      {isAdmin && unit.status === "pending" ? (
        <Card className="mb-6 border-amber-500/40">
          <p className="mb-3 text-sm text-amber-200">
            Proposed by {unit.proposedBy?.name ?? "a member"}. Approve to make it visible in the registry.
          </p>
          <div className="flex gap-2">
            <form action={reviewUnit}>
              <input type="hidden" name="id" value={unit.id} />
              <input type="hidden" name="decision" value="approved" />
              <button className={btnPrimary} type="submit">Approve</button>
            </form>
            <form action={reviewUnit}>
              <input type="hidden" name="id" value={unit.id} />
              <input type="hidden" name="decision" value="rejected" />
              <button className={btnSecondary} type="submit">Reject</button>
            </form>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {unit.description ? (
            <Card>
              <SectionTitle>About</SectionTitle>
              <p className="whitespace-pre-line leading-relaxed text-stone-300">{unit.description}</p>
              {unit.children.length ? (
                <p className="mt-4 text-sm text-stone-400">
                  Subordinate units:{" "}
                  {unit.children.map((c, i) => (
                    <span key={c.id}>
                      {i ? ", " : ""}
                      <Link href={`/units/${c.id}`} className="text-amber-400 hover:text-amber-300">
                        {c.name}
                      </Link>
                    </span>
                  ))}
                </p>
              ) : null}
            </Card>
          ) : null}

          <Card>
            <div id="wall" className="scroll-mt-24" />
            <SectionTitle>Unit wall</SectionTitle>
            {!viewer ? (
              <EmptyState title="The unit wall is for members.">
                <Link href={`/signin?next=/units/${unit.id}`} className="text-amber-400 hover:text-amber-300">
                  Sign in
                </Link>{" "}
                to read and post.
              </EmptyState>
            ) : (
              <>
                {unit.status === "approved" ? (
                  <form action={postToWall} className="mb-6 space-y-3 rounded-xl border border-stone-700 bg-stone-950/40 p-4">
                    <input type="hidden" name="unitId" value={unit.id} />
                    <textarea
                      name="body"
                      required
                      maxLength={4000}
                      className={`${inputCls} min-h-24`}
                      placeholder={`Post to ${unit.name}: a memory, a question, a photo from back then.`}
                      aria-label="Wall post"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <input
                        type="file"
                        name="image"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Attach photo"
                        className="text-sm text-stone-400 file:mr-3 file:rounded-md file:border-0 file:bg-stone-800 file:px-3 file:py-1.5 file:text-sm file:text-stone-100"
                      />
                      <button type="submit" className={btnPrimary}>
                        Post to wall
                      </button>
                    </div>
                  </form>
                ) : null}
                {posts.length ? (
                  <ul className="space-y-4">
                    {posts.map((post) => {
                      const img = mediaUrl(post.imageKey);
                      return (
                        <li key={post.id} className={`rounded-xl border p-4 ${post.hidden ? "border-red-500/40 bg-red-950/20" : "border-stone-800 bg-stone-900/40"}`}>
                          <div className="flex items-start gap-3">
                            <Avatar name={post.author.profile?.displayName ?? post.author.name} src={mediaUrl(post.author.profile?.photoKey)} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Link href={`/members/${post.author.id}`} className="font-semibold text-stone-100 hover:text-amber-300">
                                  {post.author.profile?.displayName ?? post.author.name}
                                </Link>
                                <span className="text-xs text-stone-500">{timeAgo(post.createdAt)}</span>
                                {post.hidden ? <Badge tone="red">Hidden by admin</Badge> : null}
                              </div>
                              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-300">{post.body}</p>
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="Photo attached to wall post" className="mt-3 max-h-80 rounded-lg border border-stone-700 object-cover" />
                              ) : null}
                              <div className="mt-2 flex items-center gap-1">
                                {post.author.id !== viewer.id ? (
                                  <ReportForm targetType="unit_post" targetId={post.id} returnTo={returnTo} />
                                ) : null}
                                {isAdmin ? (
                                  <form action={setContentHidden}>
                                    <input type="hidden" name="targetType" value="unit_post" />
                                    <input type="hidden" name="targetId" value={post.id} />
                                    <input type="hidden" name="hidden" value={post.hidden ? "false" : "true"} />
                                    <button type="submit" className={btnGhost}>
                                      {post.hidden ? "Unhide" : "Hide"}
                                    </button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-400">No posts yet. Be the first.</p>
                )}
              </>
            )}
          </Card>
        </div>

        <aside>
          <Card>
            <SectionTitle aside={<span className="text-xs text-stone-500">{roster.length}</span>}>Roster</SectionTitle>
            <p className="mb-4 text-xs text-stone-500">
              Members who list this unit and allow their record to be seen{viewer ? " by members" : " publicly"}.
            </p>
            {roster.length ? (
              <div className="space-y-2">
                {roster.map((e) =>
                  e.user.profile ? (
                    <MemberCard
                      key={e.id}
                      profile={e.user.profile}
                      audience={viewer ? (viewer.id === e.userId ? "self" : "member") : "public"}
                      verified={e.user.verified}
                      extra={[e.role, formatRange(e.startDate, e.endDate)].filter(Boolean).join(" · ")}
                    />
                  ) : null
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-400">No one listed yet.</p>
            )}
            {viewer ? (
              <Link href="/record#history" className={`${btnSecondary} mt-4 w-full`}>
                I served here — add to my record
              </Link>
            ) : null}
          </Card>
        </aside>
      </div>
    </Container>
  );
}
