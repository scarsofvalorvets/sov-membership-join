"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/text";
import { isBranch } from "@/lib/constants";
import { parseYear } from "@/lib/dates";

export async function createLookingFor(formData: FormData) {
  const user = await requireUser("/looking-for");
  const title = str(formData, "title", 140);
  const description = str(formData, "description", 4000);
  if (!title || !description) redirect("/looking-for?notice=invalid#new");
  const unitId = str(formData, "unitId");
  const unit = unitId
    ? await prisma.unit.findFirst({ where: { id: unitId, status: "approved" }, select: { id: true } })
    : null;
  const branch = str(formData, "branch");
  await prisma.lookingForPost.create({
    data: {
      authorId: user.id,
      title,
      description,
      unitId: unit?.id ?? null,
      unitText: unit ? null : str(formData, "unitText", 160),
      branch: isBranch(branch) ? branch : null,
      startYear: parseYear(str(formData, "startYear")),
      endYear: parseYear(str(formData, "endYear")),
    },
  });
  revalidatePath("/looking-for");
  redirect("/looking-for?notice=posted");
}

export async function closeLookingFor(formData: FormData) {
  const user = await requireUser("/looking-for");
  const id = str(formData, "id");
  if (id) {
    await prisma.lookingForPost.updateMany({ where: { id, authorId: user.id }, data: { status: "closed" } });
  }
  revalidatePath("/looking-for");
  redirect("/looking-for?notice=closed");
}
