import Link from "next/link";
import { Container } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  const [pendingUnits, openReports] = await Promise.all([
    prisma.unit.count({ where: { status: "pending" } }),
    prisma.report.count({ where: { status: "open" } }),
  ]);
  const tab = "rounded-md px-3 py-1.5 text-sm font-medium text-stone-300 hover:bg-stone-800 hover:text-amber-300";
  const count = (n: number) =>
    n ? <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-xs font-bold text-stone-950">{n}</span> : null;
  return (
    <Container>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Admin</p>
          <h1 className="text-2xl font-bold tracking-tight text-stone-50">Registry administration</h1>
        </div>
        <nav className="flex flex-wrap gap-1 rounded-lg border border-stone-700 bg-stone-900/60 p-1" aria-label="Admin">
          <Link href="/admin" className={tab}>
            Units{count(pendingUnits)}
          </Link>
          <Link href="/admin/reports" className={tab}>
            Reports{count(openReports)}
          </Link>
          <Link href="/admin/members" className={tab}>
            Members
          </Link>
        </nav>
      </div>
      {children}
    </Container>
  );
}
