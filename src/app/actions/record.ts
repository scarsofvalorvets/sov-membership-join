"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { bool, str } from "@/lib/text";
import { isBranch, isState, isStatus, isVisibility } from "@/lib/constants";
import { parseMonth, parseYear } from "@/lib/dates";
import { ensureProfile, searchNameFor, unitSearchName } from "@/lib/members";
import { saveImage } from "@/lib/storage/images";
import { getStorage } from "@/lib/storage";

function done(notice: string, hash = ""): never {
  revalidatePath("/record");
  redirect(`/record?notice=${notice}${hash}`);
}

export async function updateProfile(formData: FormData) {
  const user = await requireUser("/record");
  const profile = await ensureProfile(user.id, user.name ?? "");

  const displayName = str(formData, "displayName", 80);
  if (!displayName || displayName.length < 2) done("invalid");

  const branch = str(formData, "branch");
  const status = str(formData, "status");
  const state = str(formData, "state");
  const visibility = str(formData, "visibility") ?? "members";
  const startYear = parseYear(str(formData, "serviceStartYear"));
  const endYear = parseYear(str(formData, "serviceEndYear"));

  let photoKey = profile.photoKey;
  const photo = await saveImage(formData.get("photo"), "profiles");
  if (photo.ok) {
    if (profile.photoKey) await getStorage().delete(profile.photoKey).catch(() => {});
    photoKey = photo.key;
  } else if (photo.error) {
    done("photo_error");
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      displayName,
      searchName: searchNameFor(displayName),
      photoKey,
      branch: isBranch(branch) ? branch : null,
      status: isStatus(status) ? status : null,
      rank: str(formData, "rank", 80),
      specialty: str(formData, "specialty", 120),
      serviceStartYear: startYear,
      serviceEndYear: endYear && startYear && endYear < startYear ? null : endYear,
      bio: str(formData, "bio", 4000),
      hometown: str(formData, "hometown", 80),
      state: isState(state) ? state : null,
      visibility: isVisibility(visibility) ? visibility : "members",
      publicPhoto: bool(formData, "publicPhoto"),
      publicService: bool(formData, "publicService"),
      publicYears: bool(formData, "publicYears"),
      publicBio: bool(formData, "publicBio"),
      publicLocation: bool(formData, "publicLocation"),
      publicUnits: bool(formData, "publicUnits"),
      publicDeployments: bool(formData, "publicDeployments"),
      publicAwards: bool(formData, "publicAwards"),
    },
  });
  revalidatePath(`/members/${user.id}`);
  done("saved");
}

export async function removePhoto() {
  const user = await requireUser("/record");
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (profile?.photoKey) {
    await getStorage().delete(profile.photoKey).catch(() => {});
    await prisma.profile.update({ where: { id: profile.id }, data: { photoKey: null } });
  }
  done("removed");
}

/**
 * Add a service history entry. The member either picks an existing approved
 * unit (unitId) or proposes a new unit (newUnitName + newUnitBranch), which is
 * created as "pending" until an admin approves it.
 */
export async function addServiceEntry(formData: FormData) {
  const user = await requireUser("/record");
  let unitId = str(formData, "unitId");

  if (unitId === "__new" || !unitId) {
    const name = str(formData, "newUnitName", 120);
    const branch = str(formData, "newUnitBranch");
    if (!name || !isBranch(branch)) done("invalid", "#history");
    const location = str(formData, "newUnitLocation", 120);
    const unit = await prisma.unit.create({
      data: {
        name,
        searchName: unitSearchName(name, location),
        branch,
        unitType: str(formData, "newUnitType", 60),
        location,
        status: "pending",
        proposedById: user.id,
      },
    });
    unitId = unit.id;
  } else {
    // Existing unit must be approved, or a pending unit this member proposed.
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit || (unit.status !== "approved" && unit.proposedById !== user.id)) done("invalid", "#history");
  }

  const startDate = parseMonth(formData.get("startDate"));
  const endDate = parseMonth(formData.get("endDate"));
  await prisma.serviceEntry.create({
    data: {
      userId: user.id,
      unitId: unitId!,
      role: str(formData, "role", 120),
      startDate,
      endDate: endDate && startDate && endDate < startDate ? null : endDate,
    },
  });
  revalidatePath(`/units/${unitId}`);
  done("added", "#history");
}

export async function deleteServiceEntry(formData: FormData) {
  const user = await requireUser("/record");
  const id = str(formData, "id");
  if (id) await prisma.serviceEntry.deleteMany({ where: { id, userId: user.id } });
  done("removed", "#history");
}

export async function addDeployment(formData: FormData) {
  const user = await requireUser("/record");
  const location = str(formData, "location", 120);
  if (!location) done("invalid", "#deployments");
  const startDate = parseMonth(formData.get("startDate"));
  const endDate = parseMonth(formData.get("endDate"));
  await prisma.deployment.create({
    data: {
      userId: user.id,
      location,
      operation: str(formData, "operation", 120),
      startDate,
      endDate: endDate && startDate && endDate < startDate ? null : endDate,
    },
  });
  done("added", "#deployments");
}

export async function deleteDeployment(formData: FormData) {
  const user = await requireUser("/record");
  const id = str(formData, "id");
  if (id) await prisma.deployment.deleteMany({ where: { id, userId: user.id } });
  done("removed", "#deployments");
}

export async function addAward(formData: FormData) {
  const user = await requireUser("/record");
  const name = str(formData, "name", 160);
  if (!name) done("invalid", "#awards");
  await prisma.award.create({ data: { userId: user.id, name } });
  done("added", "#awards");
}

export async function deleteAward(formData: FormData) {
  const user = await requireUser("/record");
  const id = str(formData, "id");
  if (id) await prisma.award.deleteMany({ where: { id, userId: user.id } });
  done("removed", "#awards");
}
