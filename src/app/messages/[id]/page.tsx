import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendMessage } from "@/app/actions/messages";
import RefreshUnread from "@/components/RefreshUnread";
import { BlockForm, ReportForm } from "@/components/SafetyForms";
import { Avatar, Container, Notice, btnPrimary, inputCls } from "@/components/ui";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { isBlockedEitherWay } from "@/lib/messaging";
import { requireUser } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Conversation" };

export default async function ThreadPage(props: PageProps<"/messages/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const me = await requireUser(`/messages/${id}`);

  const convo = await prisma.conversation.findFirst({
    where: { id, participants: { some: { userId: me.id } } },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, verified: true, profile: { select: { displayName: true, photoKey: true } } } } },
      },
      messages: { where: { hidden: false }, orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!convo) notFound();

  // Mark as read.
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: convo.id, userId: me.id },
    data: { lastReadAt: new Date() },
  });

  const other = convo.participants.find((p) => p.userId !== me.id)?.user;
  const otherName = other?.profile?.displayName ?? other?.name ?? "Member";
  const blocked = other ? await isBlockedEitherWay(me.id, other.id) : true;
  const returnTo = `/messages/${convo.id}`;

  return (
    <Container narrow>
      <RefreshUnread />
      <div className="mb-4">
        <Link href="/messages" className="text-sm text-stone-400 hover:text-amber-300">
          ← Inbox
        </Link>
      </div>
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-stone-700/80 bg-stone-900/40 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={otherName} src={mediaUrl(other?.profile?.photoKey)} />
          <div>
            {other ? (
              <Link href={`/members/${other.id}`} className="font-semibold text-stone-100 hover:text-amber-300">
                {otherName}
              </Link>
            ) : (
              <span className="font-semibold text-stone-100">{otherName}</span>
            )}
            <p className="text-xs text-stone-500">Private conversation</p>
          </div>
        </div>
        {other && !blocked ? <BlockForm userId={other.id} returnTo="/messages" /> : null}
      </div>

      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />

      <ol className="mb-6 space-y-3">
        {convo.messages.map((m) => {
          const mine = m.senderId === me.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${mine ? "rounded-br-sm bg-amber-500/90 text-stone-950" : "rounded-bl-sm border border-stone-700 bg-stone-900 text-stone-100"}`}>
                <p className="whitespace-pre-line text-sm leading-relaxed">{m.body}</p>
                <div className={`mt-1 flex items-center gap-2 text-[11px] ${mine ? "text-stone-800" : "text-stone-500"}`}>
                  <span>{timeAgo(m.createdAt)}</span>
                  {!mine ? <ReportForm targetType="message" targetId={m.id} returnTo={returnTo} /> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {blocked ? (
        <p className="rounded-lg border border-stone-700 p-4 text-sm text-stone-400">
          Messaging is unavailable in this conversation.
        </p>
      ) : (
        <form action={sendMessage} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="conversationId" value={convo.id} />
          <textarea name="body" required maxLength={4000} className={`${inputCls} min-h-20 flex-1`} placeholder={`Message ${otherName}`} aria-label="Message" />
          <button type="submit" className={btnPrimary}>
            Send
          </button>
        </form>
      )}
    </Container>
  );
}
