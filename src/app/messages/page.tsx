import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Container, EmptyState, Notice, PageHeader, btnSecondary } from "@/components/ui";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Messages" };

export default async function InboxPage(props: PageProps<"/messages">) {
  const sp = await props.searchParams;
  const me = await requireUser("/messages");

  const parts = await prisma.conversationParticipant.findMany({
    where: { userId: me.id },
    include: {
      conversation: {
        include: {
          participants: {
            where: { userId: { not: me.id } },
            include: { user: { select: { id: true, name: true, profile: { select: { displayName: true, photoKey: true } } } } },
          },
          messages: { where: { hidden: false }, orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  const threads = await Promise.all(
    parts
      .filter((p) => p.conversation.messages.length > 0)
      .map(async (p) => {
        const other = p.conversation.participants[0]?.user;
        const unread = await prisma.message.count({
          where: {
            conversationId: p.conversationId,
            hidden: false,
            senderId: { not: me.id },
            createdAt: { gt: p.lastReadAt },
          },
        });
        return { id: p.conversationId, other, last: p.conversation.messages[0], unread };
      })
  );

  return (
    <Container narrow>
      <PageHeader
        eyebrow="Reconnect"
        title="Messages"
        actions={
          <Link href="/directory" className={btnSecondary}>
            Find a member
          </Link>
        }
      >
        Private messages between SoV members. Email addresses and phone numbers are never shared.
      </PageHeader>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      {threads.length ? (
        <ul className="divide-y divide-stone-800 overflow-hidden rounded-2xl border border-stone-700/80 bg-stone-900/40">
          {threads.map((t) => {
            const name = t.other?.profile?.displayName ?? t.other?.name ?? "Former member";
            return (
              <li key={t.id}>
                <Link href={`/messages/${t.id}`} className="flex items-center gap-4 p-4 transition hover:bg-stone-800/50">
                  <Avatar name={name} src={mediaUrl(t.other?.profile?.photoKey)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate ${t.unread ? "font-bold text-stone-50" : "font-medium text-stone-200"}`}>{name}</span>
                      <span className="shrink-0 text-xs text-stone-500">{timeAgo(t.last.createdAt)}</span>
                    </div>
                    <p className={`truncate text-sm ${t.unread ? "text-stone-200" : "text-stone-400"}`}>
                      {t.last.senderId === me.id ? "You: " : ""}
                      {t.last.body}
                    </p>
                  </div>
                  {t.unread ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-stone-950">
                      {t.unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="No messages yet.">
          Open a member&apos;s service record or a Looking For post to start a conversation.
        </EmptyState>
      )}
    </Container>
  );
}
