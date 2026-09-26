import type { Metadata } from "next";
import { proposeUnit } from "@/app/actions/units";
import BranchSelect from "@/components/BranchSelect";
import { Card, Container, Notice, PageHeader, btnPrimary, inputCls, labelCls } from "@/components/ui";
import { UNIT_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Propose a unit" };

export default async function NewUnitPage(props: PageProps<"/units/new">) {
  await requireUser("/units/new");
  const sp = await props.searchParams;
  const parents = await prisma.unit.findMany({
    where: { status: "approved" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return (
    <Container narrow>
      <PageHeader eyebrow="Units" title="Propose a unit">
        New units are reviewed by an SoV admin before they appear in the registry. Check the unit list first to avoid duplicates.
      </PageHeader>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      <Card>
        <form action={proposeUnit} className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelCls}>Unit name *</span>
            <input className={inputCls} name="name" required maxLength={120} placeholder="e.g. 1st Battalion, 5th Marines" />
          </label>
          <label className="block">
            <span className={labelCls}>Branch or agency *</span>
            <BranchSelect name="branch" required />
          </label>
          <label className="block">
            <span className={labelCls}>Type</span>
            <select name="unitType" className={inputCls} defaultValue="">
              <option value="">Select type</option>
              {UNIT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Location</span>
            <input className={inputCls} name="location" maxLength={120} placeholder="Base, city, or station" />
          </label>
          <label className="block">
            <span className={labelCls}>Parent unit (optional)</span>
            <select name="parentId" className={inputCls} defaultValue="">
              <option value="">None</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Description</span>
            <textarea className={`${inputCls} min-h-28`} name="description" maxLength={2000} placeholder="Mission, history, or anything that helps members recognize it." />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimary}>
              Submit for review
            </button>
          </div>
        </form>
      </Card>
    </Container>
  );
}
