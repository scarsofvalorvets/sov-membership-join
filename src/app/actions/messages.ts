"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/text";
import { getOrCreateConversation, isBlockedEitherWay } from "@/lib/messaging";

export async function startConversation(formData: FormData) {
  const user = await requireUser("/messages");
  const to = str(formData, "to");
  const body = str(formData, "body", 4000);
  if (!to || to === user.id) redirect("/messages?notice=invalid");
  const recipient = await prisma.user.findUnique({ where: { id: to }, select: { id: true } });
  if (!recipient) redirect("/messages?notice=not_found");
  if (!body) redirect(`/messages/new?to=${to}&notice=invalid`);
  if (await isBlockedEitherWay(user.id, to)) redirect("/messages?notice=blocked_dm");

  const convo = await getOrCreateConversation(user.id, to);
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: convo.id, senderId: user.id, body } }),
    prisma.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } }),
    prisma.conversationParticipant.updateMany({
      where: { conversationId: convo.id, userId: user.id },
      data: { lastReadAt: new Date() },
    }),
  ]);
  redirect(`/messages/${convo.id}`);
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser("/messages");
  const conversationId = str(formData, "conversationId");
  const body = str(formData, "body", 4000);
  const convo = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, participants: { some: { userId: user.id } } },
        include: { participants: true },
      })
    : null;
  if (!convo) redirect("/messages?notice=not_found");
  if (!body) redirect(`/messages/${convo.id}`);
  const other = convo.participants.find((p) => p.userId !== user.id);
  if (other && (await isBlockedEitherWay(user.id, other.userId))) {
    redirect(`/messages/${convo.id}?notice=blocked_dm`);
  }
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: convo.id, senderId: user.id, body } }),
    prisma.conversation.update({ where: { id: convo.id }, data: { updatedAt: new Date() } }),
    prisma.conversationParticipant.updateMany({
      where: { conversationId: convo.id, userId: user.id },
      data: { lastReadAt: new Date() },
    }),
  ]);
  revalidatePath(`/messages/${convo.id}`);
  redirect(`/messages/${convo.id}`);
}
