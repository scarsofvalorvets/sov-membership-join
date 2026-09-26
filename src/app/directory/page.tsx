import type { Metadata } from "next";
import Link from "next/link";
import BranchSelect from "@/components/BranchSelect";
import MemberCard from "@/components/MemberCard";
import { Container, EmptyState, PageHeader, Pagination, btnPrimary, btnGhost, inputCls, labelCls } from "@/components/ui";
import { SERVICE_STATUSES, US_STATES, isBranch, isState, isStatus } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { parseYear } from "@/lib/dates";
import { getCurrentUser, viewerOf } from "@/lib/session";
import { directoryWhere } from "@/lib/visibility";

export const metadata: Metadata = { title: "Member Directory" };

const PAGE_SIZE = 12;

function one(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function DirectoryPage(props: PageProps<"/directory">) {
  const sp = await props.searchParams;
  const me = await getCurrentUser();
  const viewer = viewerOf(me);

  const q = one(sp.q).slice(0, 80);
  const branch = isBranch(one(sp.branch)) ? one(sp.branch) : "";
  const status = isStatus(one(sp.status)) ? one(sp.status) : "";
  const state = isState(one(sp.state)) ? one(sp.state) : "";
  const unitId = one(sp.unit);
  const year = parseYear(one(sp.year));
  const page = Math.max(1, Number.parseInt(one(sp.page) || "1", 10) || 1);

  const where = directoryWhere({ q, branch, status, state, unitId: unitId || null, year }, viewer);

  const [total, profiles, units] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      include: { user: { select: { verified: true } } },
      orderBy: [{ displayName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.unit.findMany({
      where: { status: "approved" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (branch) params.set("branch", branch);
  if (status) params.set("status", status);
  if (state) params.set("state", state);
  if (unitId) params.set("unit", unitId);
  if (year) params.set("year", String(year));
  const hrefFor = (p: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(p));
    return `/directory?${next}`;
  };

  return (
    <Container>
      <PageHeader eyebrow="Reconnect" title="Member Directory">
        Search SoV members by name, branch or agency, unit, years served, state, and status.
        {viewer ? null : (
          <>
            {" "}
            You&apos;re seeing public profiles only.{" "}
            <Link href="/signin?next=/directory" className="text-amber-400 hover:text-amber-300">
              Sign in
            </Link>{" "}
            to see members-only records.
          </>
        )}
      </PageHeader>

      <form className="mb-8 grid gap-3 rounded-2xl border border-stone-700/80 bg-stone-900/40 p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <label className="block lg:col-span-2">
          <span className={labelCls}>Name</span>
          <input className={inputCls} name="q" defaultValue={q} placeholder="Search by name" />
        </label>
        <label className="block">
          <span className={labelCls}>Branch / agency</span>
          <BranchSelect name="branch" defaultValue={branch} placeholder="Any" />
        </label>
        <label className="block">
          <span className={labelCls}>Status</span>
          <select name="status" defaultValue={status} className={inputCls}>
            <option value="">Any</option>
            {SERVICE_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>State</span>
          <select name="state" defaultValue={state} className={inputCls}>
            <option value="">Any</option>
            {US_STATES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Served in year</span>
          <input className={inputCls} name="year" inputMode="numeric" pattern="\d{4}" defaultValue={year ?? ""} placeholder="e.g. 2004" />
        </label>
        <label className="block lg:col-span-3">
          <span className={labelCls}>Unit</span>
          <select name="unit" defaultValue={unitId} className={inputCls}>
            <option value="">Any unit</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 lg:col-span-3">
          <button type="submit" className={btnPrimary}>
            Search
          </button>
          <Link href="/directory" className={btnGhost}>
            Clear
          </Link>
          <span className="ml-auto text-sm text-stone-400">
            {total} member{total === 1 ? "" : "s"}
          </span>
        </div>
      </form>

      {profiles.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <MemberCard key={p.id} profile={p} audience={viewer ? "member" : "public"} verified={p.user.verified} />
          ))}
        </div>
      ) : (
        <EmptyState title="No members match those filters.">
          Try fewer filters, or post on the{" "}
          <Link href="/looking-for" className="text-amber-400 hover:text-amber-300">
            Looking For board
          </Link>
          .
        </EmptyState>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </Container>
  );
}
