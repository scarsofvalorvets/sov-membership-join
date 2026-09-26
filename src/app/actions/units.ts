"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/text";
import { isBranch } from "@/lib/constants";
import { unitSearchName } from "@/lib/members";
import { saveImage } from "@/lib/storage/images";

export async function proposeUnit(formData: FormData) {
  const user = await requireUser("/units/new");
  const name = str(formData, "name", 120);
  const branch = str(formData, "branch");
  if (!name || !isBranch(branch)) redirect("/units/new?notice=invalid");
  const location = str(formData, "location", 120);
  const parentId = str(formData, "parentId");
  const parent = parentId
    ? await prisma.unit.findFirst({ where: { id: parentId, status: "approved" }, select: { id: true } })
    : null;
  const unit = await prisma.unit.create({
    data: {
      name,
      searchName: unitSearchName(name, location),
      branch,
      unitType: str(formData, "unitType", 60),
      location,
      description: str(formData, "description", 2000),
      parentId: parent?.id ?? null,
      status: "pending",
      proposedById: user.id,
    },
  });
  redirect(`/units/${unit.id}?notice=proposed`);
}

export async function postToWall(formData: FormData) {
  const user = await requireUser();
  const unitId = str(formData, "unitId");
  const body = str(formData, "body", 4000);
  const unit = unitId ? await prisma.unit.findUnique({ where: { id: unitId } }) : null;
  if (!unit || unit.status !== "approved") redirect("/units?notice=not_found");
  if (!body) redirect(`/units/${unit.id}?notice=invalid#wall`);

  const image = await saveImage(formData.get("image"), "posts");
  if (!image.ok && image.error) redirect(`/units/${unit.id}?notice=photo_error#wall`);

  await prisma.unitPost.create({
    data: { unitId: unit.id, authorId: user.id, body, imageKey: image.ok ? image.key : null },
  });
  revalidatePath(`/units/${unit.id}`);
  redirect(`/units/${unit.id}?notice=posted#wall`);
}
