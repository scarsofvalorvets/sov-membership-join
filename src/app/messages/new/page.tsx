import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { startConversation } from "@/app/actions/messages";
import { Avatar, Card, Container, Notice, PageHeader, btnPrimary, inputCls } from "@/components/ui";
import { prisma } from "@/lib/db";
import { isBlockedEitherWay, pairKey } from "@/lib/messaging";
import { requireUser } from "@/lib/session";
import { mediaUrl } from "@/lib/storage";
import { audienceFor, canViewProfile } from "@/lib/visibility";

export const metadata: Metadata = { title: "New message" };

export default async function NewMessagePage(props: PageProps<"/messages/new">) {
  const sp = await props.searchParams;
  const to = typeof sp.to === "string" ? sp.to : "";
  const ref = typeof sp.ref === "string" ? sp.ref : "";
  const me = await requireUser(`/messages/new?to=${to}`);
  if (!to || to === me.id) redirect("/messages");

  const recipient = await prisma.user.findUnique({
    where: { id: to },
    select: { id: true, adminHidden: true, profile: true },
  });
  if (!recipient?.profile) redirect("/messages?notice=not_found");
  if (await isBlockedEitherWay(me.id, to)) redirect("/messages?notice=blocked_dm");

  // Hidden members can't be messaged cold, but an existing thread still works.
  const existing = await prisma.conversation.findUnique({ where: { pairKey: pairKey(me.id, to) } });
  if (existing) redirect(`/messages/${existing.id}`);
  const lf = ref
    ? await prisma.lookingForPost.findFirst({ where: { id: ref, authorId: to, hidden: false }, select: { title: true } })
    : null;
  if (!lf && !canViewProfile(recipient.profile, recipient.adminHidden, audienceFor({ id: me.id, role: me.role }, to))) {
    redirect("/messages?notice=blocked_dm");
  }

  const name = recipient.profile.displayName;
  return (
    <Container narrow>
      <PageHeader eyebrow="Messages" title={`Message ${name}`}>
        Your email and phone stay private. {name} will see your display name and can reply here.
      </PageHeader>
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Avatar name={name} src={recipient.profile.visibility !== "hidden" ? mediaUrl(recipient.profile.photoKey) : null} />
          <Link href={`/members/${to}`} className="font-semibold text-stone-100 hover:text-amber-300">
            {name}
          </Link>
        </div>
        <form action={startConversation} className="space-y-3">
          <input type="hidden" name="to" value={to} />
          <textarea
            name="body"
            required
            maxLength={4000}
            className={`${inputCls} min-h-32`}
            defaultValue={lf ? `Re: your Looking For post "${lf.title}"\n\n` : ""}
            aria-label="Message"
          />
          <button type="submit" className={btnPrimary}>
            Send message
          </button>
        </form>
      </Card>
    </Container>
  );
}
