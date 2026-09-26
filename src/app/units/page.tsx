import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Container, EmptyState, Notice, PageHeader, Pagination, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { BRANCHES, branchLabel, isBranch } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Units" };

const PAGE_SIZE = 24;

export default async function UnitsPage(props: PageProps<"/units">) {
  const sp = await props.searchParams;
  const branch = typeof sp.branch === "string" && isBranch(sp.branch) ? sp.branch : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    status: "approved",
    ...(branch ? { branch } : {}),
    ...(q ? { searchName: { contains: q.toLowerCase() } } : {}),
  };
  const [total, units, counts] = await Promise.all([
    prisma.unit.count({ where }),
    prisma.unit.findMany({
      where,
      include: { parent: { select: { name: true } }, _count: { select: { entries: true, posts: true } } },
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.unit.groupBy({ by: ["branch"], where: { status: "approved" }, _count: { _all: true } }),
  ]);
  const countFor = (b: string) => counts.find((c) => c.branch === b)?._count._all ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const n = new URLSearchParams();
    if (branch) n.set("branch", branch);
    if (q) n.set("q", q);
    n.set("page", String(p));
    return `/units?${n}`;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition ${
      active ? "border-amber-500 bg-amber-500/15 text-amber-300" : "border-stone-700 text-stone-300 hover:border-stone-500"
    }`;

  return (
    <Container>
      <PageHeader
        eyebrow="Registry"
        title="Units"
        actions={
          <Link href="/units/new" className={btnSecondary}>
            Propose a unit
          </Link>
        }
      >
        Battalions, ships, squadrons, stations, and departments. Open a unit to see who served there and post on its wall.
      </PageHeader>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/units" className={chip(!branch)}>
          All
        </Link>
        {BRANCHES.map((b) => (
          <Link key={b.id} href={`/units?branch=${b.id}`} className={chip(branch === b.id)}>
            {b.label} <span className="text-stone-500">{countFor(b.id)}</span>
          </Link>
        ))}
      </div>

      <form className="mb-6 flex gap-2" role="search">
        {branch ? <input type="hidden" name="branch" value={branch} /> : null}
        <input className={inputCls} name="q" defaultValue={q} placeholder="Search units by name or location" aria-label="Search units" />
        <button type="submit" className={btnPrimary}>
          Search
        </button>
      </form>

      {units.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((u) => (
            <Link
              key={u.id}
              href={`/units/${u.id}`}
              className="rounded-xl border border-stone-700/80 bg-stone-900/40 p-4 transition hover:border-amber-500/60"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-stone-100">{u.name}</p>
                <Badge tone="blue">{branchLabel(u.branch)}</Badge>
              </div>
              <p className="mt-1 text-sm text-stone-400">
                {[u.unitType, u.location].filter(Boolean).join(" · ")}
              </p>
              {u.parent ? <p className="mt-1 text-xs text-stone-500">Part of {u.parent.name}</p> : null}
              <p className="mt-3 text-xs text-stone-500">
                {u._count.entries} service record{u._count.entries === 1 ? "" : "s"} · {u._count.posts} wall post
                {u._count.posts === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No units found.">
          Don&apos;t see yours?{" "}
          <Link href="/units/new" className="text-amber-400 hover:text-amber-300">
            Propose it
          </Link>
          .
        </EmptyState>
      )}
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </Container>
  );
}
