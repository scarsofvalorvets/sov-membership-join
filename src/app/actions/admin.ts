"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { str } from "@/lib/text";

function back(notice = "saved", tab = ""): never {
  revalidatePath("/admin", "layout");
  redirect(`/admin${tab}?notice=${notice}`);
}

export async function reviewUnit(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const decision = str(formData, "decision");
  if (id && (decision === "approved" || decision === "rejected")) {
    await prisma.unit.update({ where: { id }, data: { status: decision, reviewedAt: new Date() } });
    revalidatePath(`/units/${id}`);
  }
  back("saved");
}

export async function setVerified(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "userId");
  const verified = str(formData, "verified") === "true";
  if (id) {
    await prisma.user.update({ where: { id }, data: { verified, verifiedAt: verified ? new Date() : null } });
    revalidatePath(`/members/${id}`);
  }
  back("saved", "/members");
}

export async function setProfileHidden(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "userId");
  const hidden = str(formData, "hidden") === "true";
  if (id) {
    await prisma.user.update({ where: { id }, data: { adminHidden: hidden } });
    revalidatePath(`/members/${id}`);
  }
  back("saved", "/members");
}

/** Hide or restore a piece of member content (wall post, message, Looking For post). */
export async function setContentHidden(formData: FormData) {
  await requireAdmin();
  const type = str(formData, "targetType");
  const id = str(formData, "targetId");
  const hidden = str(formData, "hidden") === "true";
  if (id) {
    if (type === "unit_post") await prisma.unitPost.updateMany({ where: { id }, data: { hidden } });
    else if (type === "message") await prisma.message.updateMany({ where: { id }, data: { hidden } });
    else if (type === "looking_for") await prisma.lookingForPost.updateMany({ where: { id }, data: { hidden } });
    else if (type === "profile") await prisma.user.updateMany({ where: { id }, data: { adminHidden: hidden } });
  }
  const reportId = str(formData, "reportId");
  if (reportId && hidden) {
    const admin = await requireAdmin();
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "actioned", resolvedById: admin.id, resolvedAt: new Date() },
    });
  }
  back("saved", reportId ? "/reports" : "");
}

export async function resolveReport(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status");
  if (id && (status === "dismissed" || status === "actioned" || status === "open")) {
    await prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedById: status === "open" ? null : admin.id,
        resolvedAt: status === "open" ? null : new Date(),
      },
    });
  }
  back("saved", "/reports");
}
