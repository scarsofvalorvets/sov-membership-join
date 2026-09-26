import type { Metadata } from "next";
import Link from "next/link";
import { resolveReport, setContentHidden } from "@/app/actions/admin";
import { Badge, Card, EmptyState, Notice, btnGhost, btnPrimary, btnSecondary } from "@/components/ui";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Admin · Reports" };

type Target = { text: string; author?: { id: string; name: string | null } | null; href?: string; hidden: boolean } | null;

async function loadTarget(type: string, id: string): Promise<Target> {
  switch (type) {
    case "unit_post": {
      const p = await prisma.unitPost.findUnique({ where: { id }, include: { author: { select: { id: true, name: true } } } });
      return p ? { text: p.body, author: p.author, href: `/units/${p.unitId}#wall`, hidden: p.hidden } : null;
    }
    case "message": {
      const m = await prisma.message.findUnique({ where: { id }, include: { sender: { select: { id: true, name: true } } } });
      // Admins see only the reported message, not the whole private thread.
      return m ? { text: m.body, author: m.sender, hidden: m.hidden } : null;
    }
    case "looking_for": {
      const l = await prisma.lookingForPost.findUnique({ where: { id }, include: { author: { select: { id: true, name: true } } } });
      return l ? { text: `${l.title}\n\n${l.description}`, author: l.author, href: "/looking-for", hidden: l.hidden } : null;
    }
    case "profile": {
      const u = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, adminHidden: true } });
      return u ? { text: "Member profile", author: u, href: `/members/${u.id}`, hidden: u.adminHidden } : null;
    }
    default:
      return null;
  }
}

const TYPE_LABEL: Record<string, string> = {
  unit_post: "Wall post",
  message: "Direct message",
  looking_for: "Looking For post",
  profile: "Profile",
};

export default async function AdminReportsPage(props: PageProps<"/admin/reports">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const showAll = sp.all === "1";
  const reports = await prisma.report.findMany({
    where: showAll ? {} : { status: "open" },
    include: { reporter: { select: { id: true, name: true } }, resolvedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const withTargets = await Promise.all(reports.map(async (r) => ({ r, target: await loadTarget(r.targetType, r.targetId) })));

  return (
    <div className="space-y-4">
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      <div className="flex justify-end">
        <Link href={showAll ? "/admin/reports" : "/admin/reports?all=1"} className={btnGhost}>
          {showAll ? "Show open only" : "Show all reports"}
        </Link>
      </div>
      {withTargets.length ? (
        withTargets.map(({ r, target }) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">{TYPE_LABEL[r.targetType] ?? r.targetType}</Badge>
                <Badge tone={r.status === "open" ? "gold" : r.status === "actioned" ? "green" : "stone"}>{r.status}</Badge>
                {target?.hidden ? <Badge tone="red">Content hidden</Badge> : null}
              </div>
              <span className="text-xs text-stone-500">
                Reported by {r.reporter.name} · {timeAgo(r.createdAt)}
                {r.resolvedBy ? ` · resolved by ${r.resolvedBy.name}` : ""}
              </span>
            </div>
            <p className="mt-3 text-sm text-stone-300">
              <span className="text-stone-500">Reason: </span>
              {r.reason}
            </p>
            {target ? (
              <blockquote className="mt-3 whitespace-pre-line rounded-lg border-l-2 border-amber-500/60 bg-stone-950/60 p-3 text-sm text-stone-300">
                {target.text}
                {target.author ? (
                  <footer className="mt-2 text-xs text-stone-500">
                    —{" "}
                    <Link href={`/members/${target.author.id}`} className="hover:text-amber-300">
                      {target.author.name}
                    </Link>
                    {target.href ? (
                      <>
                        {" · "}
                        <Link href={target.href} className="hover:text-amber-300">
                          View in context
                        </Link>
                      </>
                    ) : null}
                  </footer>
                ) : null}
              </blockquote>
            ) : (
              <p className="mt-3 text-sm text-stone-500">The reported item no longer exists.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {target ? (
                <form action={setContentHidden}>
                  <input type="hidden" name="targetType" value={r.targetType} />
                  <input type="hidden" name="targetId" value={r.targetId} />
                  <input type="hidden" name="hidden" value={target.hidden ? "false" : "true"} />
                  <input type="hidden" name="reportId" value={r.id} />
                  <button type="submit" className={target.hidden ? btnSecondary : btnPrimary}>
                    {target.hidden ? "Restore content" : r.targetType === "profile" ? "Hide profile" : "Hide content"}
                  </button>
                </form>
              ) : null}
              {r.status === "open" ? (
                <form action={resolveReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="dismissed" />
                  <button type="submit" className={btnSecondary}>
                    Dismiss
                  </button>
                </form>
              ) : (
                <form action={resolveReport}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="open" />
                  <button type="submit" className={btnGhost}>
                    Reopen
                  </button>
                </form>
              )}
            </div>
          </Card>
        ))
      ) : (
        <EmptyState title="No open reports." />
      )}
    </div>
  );
}
