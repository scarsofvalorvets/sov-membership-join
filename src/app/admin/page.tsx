import type { Metadata } from "next";
import Link from "next/link";
import { reviewUnit } from "@/app/actions/admin";
import { Badge, Card, EmptyState, Notice, SectionTitle, btnPrimary, btnSecondary } from "@/components/ui";
import { branchLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Units" };

export default async function AdminUnitsPage(props: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const [pending, recent, stats] = await Promise.all([
    prisma.unit.findMany({
      where: { status: "pending" },
      include: {
        proposedBy: { select: { id: true, name: true } },
        parent: { select: { name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.unit.findMany({
      where: { status: { in: ["approved", "rejected"] }, reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
    }),
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.unit.count({ where: { status: "approved" } }),
      prisma.unitPost.count(),
    ]),
  ]);
  const [members, verified, units, posts] = stats;

  return (
    <div className="space-y-6">
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Members", members],
          ["Verified", verified],
          ["Approved units", units],
          ["Wall posts", posts],
        ].map(([label, n]) => (
          <div key={label} className="rounded-xl border border-stone-700/80 bg-stone-900/40 p-4">
            <p className="text-2xl font-bold text-stone-50">{n}</p>
            <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <SectionTitle aside={<span className="text-xs text-stone-500">{pending.length} pending</span>}>Units awaiting review</SectionTitle>
        {pending.length ? (
          <ul className="divide-y divide-stone-800">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/units/${u.id}`} className="font-semibold text-stone-100 hover:text-amber-300">
                    {u.name}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-400">
                    <Badge tone="blue">{branchLabel(u.branch)}</Badge>
                    {[u.unitType, u.location, u.parent ? `Part of ${u.parent.name}` : null].filter(Boolean).join(" · ")}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    Proposed by {u.proposedBy ? <Link href={`/members/${u.proposedBy.id}`} className="hover:text-amber-300">{u.proposedBy.name}</Link> : "unknown"} ·{" "}
                    {timeAgo(u.createdAt)} · {u._count.entries} service record{u._count.entries === 1 ? "" : "s"} waiting
                  </p>
                  {u.description ? <p className="mt-2 max-w-2xl text-sm text-stone-300">{u.description}</p> : null}
                </div>
                <div className="flex gap-2">
                  <form action={reviewUnit}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <button type="submit" className={btnPrimary}>
                      Approve
                    </button>
                  </form>
                  <form action={reviewUnit}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <button type="submit" className={btnSecondary}>
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No units waiting for review." />
        )}
      </Card>

      {recent.length ? (
        <Card>
          <SectionTitle>Recently reviewed</SectionTitle>
          <ul className="space-y-1 text-sm">
            {recent.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2">
                <Link href={`/units/${u.id}`} className="text-stone-200 hover:text-amber-300">
                  {u.name}
                </Link>
                <Badge tone={u.status === "approved" ? "green" : "red"}>{u.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
