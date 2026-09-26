import type { Metadata } from "next";
import Link from "next/link";
import { setContentHidden } from "@/app/actions/admin";
import { closeLookingFor, createLookingFor } from "@/app/actions/looking-for";
import BranchSelect from "@/components/BranchSelect";
import { ReportForm } from "@/components/SafetyForms";
import {
  Avatar,
  Badge,
  Card,
  Container,
  EmptyState,
  Notice,
  PageHeader,
  Pagination,
  SectionTitle,
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputCls,
  labelCls,
} from "@/components/ui";
import { branchLabel, isBranch } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatYears, timeAgo } from "@/lib/dates";
import { getCurrentUser } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Looking For" };

const PAGE_SIZE = 10;

export default async function LookingForPage(props: PageProps<"/looking-for">) {
  const sp = await props.searchParams;
  const me = await getCurrentUser();

  if (!me) {
    return (
      <Container narrow>
        <PageHeader eyebrow="Reconnect" title="Looking For">
          Members post here when they&apos;re trying to find someone they served with.
        </PageHeader>
        <EmptyState title="The Looking For board is for members.">
          <Link href="/signin?next=/looking-for" className="text-amber-400 hover:text-amber-300">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/" className="text-amber-400 hover:text-amber-300">
            join
          </Link>{" "}
          to read and post.
        </EmptyState>
      </Container>
    );
  }

  const isAdmin = me.role === "admin";
  const branch = typeof sp.branch === "string" && isBranch(sp.branch) ? sp.branch : "";
  const showClosed = sp.closed === "1";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(isAdmin ? {} : { hidden: false }),
    ...(showClosed ? {} : { status: "open" }),
    ...(branch ? { OR: [{ branch }, { unit: { branch } }] } : {}),
    author: {
      blocksReceived: { none: { blockerId: me.id } },
      blocksMade: { none: { blockedId: me.id } },
    },
  };

  const [total, posts, units] = await Promise.all([
    prisma.lookingForPost.count({ where }),
    prisma.lookingForPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, verified: true, profile: { select: { displayName: true, photoKey: true } } } },
        unit: { select: { id: true, name: true, branch: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.unit.findMany({ where: { status: "approved" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const n = new URLSearchParams();
    if (branch) n.set("branch", branch);
    if (showClosed) n.set("closed", "1");
    n.set("page", String(p));
    return `/looking-for?${n}`;
  };

  return (
    <Container>
      <PageHeader
        eyebrow="Reconnect"
        title="Looking For"
        actions={
          <a href="#new" className={btnPrimary}>
            Post a search
          </a>
        }
      >
        Trying to find someone you served with? Post the unit, timeframe, and what you remember. Members reply by private message.
      </PageHeader>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div>
          <form className="mb-4 flex flex-wrap items-end gap-2">
            <label className="block min-w-48 flex-1">
              <span className={labelCls}>Branch / agency</span>
              <BranchSelect name="branch" defaultValue={branch} placeholder="Any" />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-stone-300">
              <input type="checkbox" name="closed" value="1" defaultChecked={showClosed} className="accent-amber-500" />
              Include closed
            </label>
            <button type="submit" className={btnSecondary}>
              Filter
            </button>
          </form>

          {posts.length ? (
            <ul className="space-y-4">
              {posts.map((p) => {
                const name = p.author.profile?.displayName ?? p.author.name ?? "Member";
                const mine = p.author.id === me.id;
                const unitLabel = p.unit?.name ?? p.unitText;
                const br = p.branch ?? p.unit?.branch;
                return (
                  <li key={p.id}>
                    <Card className={p.hidden ? "border-red-500/40" : ""}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold text-stone-50">{p.title}</h2>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-400">
                            {br ? <Badge tone="blue">{branchLabel(br)}</Badge> : null}
                            {unitLabel ? (
                              p.unit ? (
                                <Link href={`/units/${p.unit.id}`} className="text-amber-300 hover:text-amber-200">
                                  {unitLabel}
                                </Link>
                              ) : (
                                <span>{unitLabel}</span>
                              )
                            ) : null}
                            {p.startYear || p.endYear ? <span>{formatYears(p.startYear, p.endYear)}</span> : null}
                            {p.status === "closed" ? <Badge>Closed</Badge> : null}
                            {p.hidden ? <Badge tone="red">Hidden by admin</Badge> : null}
                          </div>
                        </div>
                        <span className="text-xs text-stone-500">{timeAgo(p.createdAt)}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-300">{p.description}</p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800 pt-3">
                        <Link href={`/members/${p.author.id}`} className="flex items-center gap-2 text-sm text-stone-300 hover:text-amber-300">
                          <Avatar name={name} src={mediaUrl(p.author.profile?.photoKey)} size="sm" />
                          {name}
                        </Link>
                        <div className="flex items-center gap-1">
                          {mine ? (
                            p.status === "open" ? (
                              <form action={closeLookingFor}>
                                <input type="hidden" name="id" value={p.id} />
                                <button type="submit" className={btnGhost}>
                                  Mark found / close
                                </button>
                              </form>
                            ) : null
                          ) : (
                            <>
                              <Link href={`/messages/new?to=${p.author.id}&ref=${p.id}`} className={btnSecondary}>
                                Reply by message
                              </Link>
                              <ReportForm targetType="looking_for" targetId={p.id} returnTo="/looking-for" />
                            </>
                          )}
                          {isAdmin ? (
                            <form action={setContentHidden}>
                              <input type="hidden" name="targetType" value="looking_for" />
                              <input type="hidden" name="targetId" value={p.id} />
                              <input type="hidden" name="hidden" value={p.hidden ? "false" : "true"} />
                              <button type="submit" className={btnGhost}>
                                {p.hidden ? "Unhide" : "Hide"}
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No open searches right now." />
          )}
          <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </div>

        <aside>
          <Card>
            <div id="new" className="scroll-mt-24" />
            <SectionTitle>Post a search</SectionTitle>
            <form action={createLookingFor} className="space-y-3">
              <label className="block">
                <span className={labelCls}>Headline *</span>
                <input className={inputCls} name="title" required maxLength={140} placeholder="Looking for my team leader from Ramadi" />
              </label>
              <label className="block">
                <span className={labelCls}>Unit</span>
                <select name="unitId" className={inputCls} defaultValue="">
                  <option value="">Not listed / not sure</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelCls}>Or type the unit</span>
                <input className={inputCls} name="unitText" maxLength={160} placeholder="Unit, ship, or department" />
              </label>
              <label className="block">
                <span className={labelCls}>Branch / agency</span>
                <BranchSelect name="branch" placeholder="Any" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={labelCls}>From (year)</span>
                  <input className={inputCls} name="startYear" inputMode="numeric" pattern="\d{4}" placeholder="2004" />
                </label>
                <label className="block">
                  <span className={labelCls}>To (year)</span>
                  <input className={inputCls} name="endYear" inputMode="numeric" pattern="\d{4}" placeholder="2006" />
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>What you remember *</span>
                <textarea
                  className={`${inputCls} min-h-28`}
                  name="description"
                  required
                  maxLength={4000}
                  placeholder="Names, nicknames, where and when. Don't post anyone's phone, address, or other private details."
                />
              </label>
              <button type="submit" className={`${btnPrimary} w-full`}>
                Post
              </button>
            </form>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
