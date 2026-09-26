import { prisma } from "@/lib/db";

export function searchNameFor(displayName: string): string {
  return displayName.trim().toLowerCase();
}

export function unitSearchName(name: string, location?: string | null): string {
  return [name, location].filter(Boolean).join(" ").trim().toLowerCase();
}

/** Ensure every member has a Profile row (created lazily with safe defaults). */
export async function ensureProfile(userId: string, fallbackName: string) {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) return existing;
  const displayName = fallbackName.trim() || "SoV Member";
  return prisma.profile.create({
    data: { userId, displayName, searchName: searchNameFor(displayName), visibility: "members" },
  });
}
