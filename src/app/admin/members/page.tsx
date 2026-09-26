import type { Metadata } from "next";
import Link from "next/link";
import { setProfileHidden, setVerified } from "@/app/actions/admin";
import { Avatar, Badge, Notice, Pagination, VerifiedBadge, btnGhost, btnPrimary, btnSecondary, inputCls } from "@/components/ui";
import { branchLabel } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";
import { getTier } from "@/lib/tiers";

export const metadata: Metadata = { title: "Admin · Members" };

const PAGE_SIZE = 25;

export default async function AdminMembersPage(props: PageProps<"/admin/members">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 80) : "";
  const filter = typeof sp.filter === "string" ? sp.filter : "";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(q ? { OR: [{ email: { contains: q } }, { profile: { searchName: { contains: q } } }] } : {}),
    ...(filter === "unverified" ? { verified: false } : filter === "hidden" ? { adminHidden: true } : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { profile: { select: { displayName: true, photoKey: true, branch: true, visibility: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) => {
    const n = new URLSearchParams();
    if (q) n.set("q", q);
    if (filter) n.set("filter", filter);
    n.set("page", String(p));
    return `/admin/members?${n}`;
  };

  return (
    <div>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input className={`${inputCls} max-w-sm`} name="q" defaultValue={q} placeholder="Name or email" aria-label="Search members" />
        <select name="filter" defaultValue={filter} className={`${inputCls} max-w-48`} aria-label="Filter">
          <option value="">All members</option>
          <option value="unverified">Not verified</option>
          <option value="hidden">Hidden by admin</option>
        </select>
        <button type="submit" className={btnSecondary}>
          Search
        </button>
      </form>
      <p className="mb-3 text-xs text-stone-500">
        Verify only after an offline review (phone or in-person conversation). Do not request or store SSNs or DD-214s.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-stone-700/80">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-stone-900/80 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800">
            {users.map((u) => {
              const name = u.profile?.displayName ?? u.name ?? u.email;
              return (
                <tr key={u.id} className="bg-stone-950/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} src={mediaUrl(u.profile?.photoKey)} size="sm" />
                      <div>
                        <Link href={`/members/${u.id}`} className="font-medium text-stone-100 hover:text-amber-300">
                          {name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1 text-xs text-stone-500">
                          {u.email}
                          {u.role === "admin" ? <Badge tone="gold">admin</Badge> : null}
                          {u.verified ? <VerifiedBadge /> : null}
                          {u.adminHidden ? <Badge tone="red">hidden</Badge> : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-300">
                    {u.tier ? getTier(u.tier)?.name : "—"}
                    {u.membershipStatus === "pending_payment" ? <span className="block text-xs text-amber-400">payment pending</span> : null}
                  </td>
                  <td className="px-4 py-3 text-stone-300">{branchLabel(u.profile?.branch) || "—"}</td>
                  <td className="px-4 py-3 text-stone-300">{u.profile?.visibility ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <form action={setVerified}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="verified" value={u.verified ? "false" : "true"} />
                        <button type="submit" className={u.verified ? btnGhost : `${btnPrimary} px-3 py-1 text-xs`}>
                          {u.verified ? "Unverify" : "Verify"}
                        </button>
                      </form>
                      <form action={setProfileHidden}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="hidden" value={u.adminHidden ? "false" : "true"} />
                        <button type="submit" className={btnGhost}>
                          {u.adminHidden ? "Unhide" : "Hide"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </div>
  );
}
