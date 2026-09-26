import { prisma } from "@/lib/db";
import { pairKey } from "@/lib/pair-key";

export { pairKey };

/** True if either member has blocked the other. */
export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const count = await prisma.block.count({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
  });
  return count > 0;
}

export async function getOrCreateConversation(a: string, b: string) {
  const key = pairKey(a, b);
  const existing = await prisma.conversation.findUnique({ where: { pairKey: key } });
  if (existing) return existing;
  return prisma.conversation.create({
    data: {
      pairKey: key,
      participants: { create: [{ userId: a }, { userId: b }] },
    },
  });
}

/** Number of unread messages across all of a member's conversations. */
export async function unreadCount(userId: string): Promise<number> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  });
  if (parts.length === 0) return 0;
  return prisma.message.count({
    where: {
      hidden: false,
      senderId: { not: userId },
      OR: parts.map((p) => ({ conversationId: p.conversationId, createdAt: { gt: p.lastReadAt } })),
    },
  });
}
