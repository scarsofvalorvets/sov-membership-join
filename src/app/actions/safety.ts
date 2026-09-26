"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/text";
import { isReportTarget } from "@/lib/constants";

function back(formData: FormData, notice: string): never {
  const ret = str(formData, "returnTo", 300) ?? "/";
  const safe = ret.startsWith("/") && !ret.startsWith("//") ? ret : "/";
  const [path, hash] = safe.split("#");
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}notice=${notice}${hash ? `#${hash}` : ""}`);
}

export async function blockMember(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, "userId");
  if (id && id !== user.id) {
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: id } },
      create: { blockerId: user.id, blockedId: id },
      update: {},
    });
  }
  back(formData, "blocked");
}

export async function unblockMember(formData: FormData) {
  const user = await requireUser();
  const id = str(formData, "userId");
  if (id) await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: id } });
  revalidatePath("/account");
  back(formData, "unblocked");
}

export async function reportContent(formData: FormData) {
  const user = await requireUser();
  const targetType = str(formData, "targetType");
  const targetId = str(formData, "targetId");
  const reason = str(formData, "reason", 1000) ?? "No reason given";
  if (!isReportTarget(targetType) || !targetId) back(formData, "invalid");
  await prisma.report.create({ data: { reporterId: user.id, targetType, targetId, reason } });
  back(formData, "reported");
}
