import type { Prisma } from "@/generated/prisma/client";

/**
 * Privacy rules for member profiles. Pure functions so they can be unit-tested.
 *
 *  visibility = "hidden"  -> only the owner and admins
 *  visibility = "members" -> any signed-in member (default)
 *  visibility = "public"  -> anyone; signed-out visitors see ONLY the display
 *                            name plus fields the member explicitly opted in.
 *  adminHidden = true     -> treated as hidden regardless of member setting.
 *
 * Email and phone are never part of a profile view.
 */

export type Viewer = { id: string; role: string } | null;
export type Audience = "self" | "admin" | "member" | "public";

export type ProfilePrivacy = {
  visibility: string;
  publicPhoto: boolean;
  publicService: boolean;
  publicYears: boolean;
  publicBio: boolean;
  publicLocation: boolean;
  publicUnits: boolean;
  publicDeployments: boolean;
  publicAwards: boolean;
};

export type Sections = {
  photo: boolean;
  service: boolean;
  years: boolean;
  bio: boolean;
  location: boolean;
  units: boolean;
  deployments: boolean;
  awards: boolean;
};

export function audienceFor(viewer: Viewer, ownerId: string): Audience {
  if (!viewer) return "public";
  if (viewer.id === ownerId) return "self";
  if (viewer.role === "admin") return "admin";
  return "member";
}

export function canViewProfile(
  profile: Pick<ProfilePrivacy, "visibility">,
  adminHidden: boolean,
  audience: Audience
): boolean {
  if (audience === "self" || audience === "admin") return true;
  if (adminHidden) return false;
  switch (profile.visibility) {
    case "public":
      return true;
    case "members":
      return audience === "member";
    default:
      return false; // "hidden" or anything unexpected
  }
}

export function visibleSections(profile: ProfilePrivacy, audience: Audience): Sections {
  if (audience !== "public") {
    return {
      photo: true,
      service: true,
      years: true,
      bio: true,
      location: true,
      units: true,
      deployments: true,
      awards: true,
    };
  }
  return {
    photo: profile.publicPhoto,
    service: profile.publicService,
    years: profile.publicYears,
    bio: profile.publicBio,
    location: profile.publicLocation,
    units: profile.publicUnits,
    deployments: profile.publicDeployments,
    awards: profile.publicAwards,
  };
}

export type DirectoryFilters = {
  q?: string | null;
  branch?: string | null;
  status?: string | null;
  state?: string | null;
  unitId?: string | null;
  year?: number | null;
};

/**
 * Build the Prisma `where` for the member directory. Signed-out visitors only
 * match public profiles, and every filter they apply is restricted to members
 * who opted that field in publicly (so a filter can't be used to infer a
 * field the member kept private).
 */
export function directoryWhere(filters: DirectoryFilters, viewer: Viewer): Prisma.ProfileWhereInput {
  const isPublic = !viewer;
  const and: Prisma.ProfileWhereInput[] = [
    { visibility: { in: isPublic ? ["public"] : ["members", "public"] } },
    { user: { adminHidden: false } },
  ];

  if (viewer) {
    and.push({ userId: { not: viewer.id } });
    // Hide members in either direction of a block.
    and.push({
      user: {
        blocksReceived: { none: { blockerId: viewer.id } },
        blocksMade: { none: { blockedId: viewer.id } },
      },
    });
  }

  const q = filters.q?.trim().toLowerCase();
  if (q) and.push({ searchName: { contains: q } });

  if (filters.branch) {
    and.push({ branch: filters.branch });
    if (isPublic) and.push({ publicService: true });
  }
  if (filters.status) {
    and.push({ status: filters.status });
    if (isPublic) and.push({ publicService: true });
  }
  if (filters.state) {
    and.push({ state: filters.state });
    if (isPublic) and.push({ publicLocation: true });
  }
  if (filters.unitId) {
    and.push({ user: { serviceEntries: { some: { unitId: filters.unitId } } } });
    if (isPublic) and.push({ publicUnits: true });
  }
  if (filters.year) {
    and.push({ serviceStartYear: { lte: filters.year } });
    and.push({ OR: [{ serviceEndYear: null }, { serviceEndYear: { gte: filters.year } }] });
    if (isPublic) and.push({ publicYears: true });
  }

  return { AND: and };
}

/** Which profiles may appear on a unit roster for this viewer. */
export function rosterProfileWhere(viewer: Viewer): Prisma.ProfileWhereInput {
  if (!viewer) return { visibility: "public", publicUnits: true };
  return { visibility: { in: ["members", "public"] } };
}
