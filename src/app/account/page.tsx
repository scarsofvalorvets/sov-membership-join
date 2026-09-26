import type { Metadata } from "next";
import Link from "next/link";
import { updateAccount } from "@/app/actions/account";
import { signOutAction } from "@/app/actions/auth";
import { unblockMember } from "@/app/actions/safety";
import { Badge, Card, Container, Notice, PageHeader, SectionTitle, VerifiedBadge, btnGhost, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";
import { prisma } from "@/lib/db";
import { formatMonth } from "@/lib/dates";
import { requireUser } from "@/lib/session";
import { getTier } from "@/lib/tiers";

export const metadata: Metadata = { title: "Account" };

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  pending_payment: "Payment pending",
  canceled: "Canceled",
  none: "No membership",
};

export default async function AccountPage(props: PageProps<"/account">) {
  const sp = await props.searchParams;
  const me = await requireUser("/account");
  const tier = me.tier ? getTier(me.tier) : null;
  const blocks = await prisma.block.findMany({
    where: { blockerId: me.id },
    include: { blocked: { select: { id: true, name: true, profile: { select: { displayName: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container narrow>
      <PageHeader eyebrow="Settings" title="Account" />
      <Notice code={typeof sp.notice === "string" ? sp.notice : null} />

      <div className="space-y-6">
        <Card>
          <SectionTitle>Membership</SectionTitle>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500">Tier</dt>
              <dd className="mt-0.5 font-medium text-stone-100">{tier ? `${tier.name} (${tier.priceLabel})` : "None"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Status</dt>
              <dd className="mt-0.5 font-medium text-stone-100">{STATUS_LABEL[me.membershipStatus] ?? me.membershipStatus}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Role</dt>
              <dd className="mt-0.5">{me.role === "admin" ? <Badge tone="gold">Admin</Badge> : <Badge>Member</Badge>}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Verification</dt>
              <dd className="mt-0.5">{me.verified ? <VerifiedBadge /> : <span className="text-stone-300">Not yet verified</span>}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Member since</dt>
              <dd className="mt-0.5 text-stone-100">{formatMonth(me.createdAt)}</dd>
            </div>
          </dl>
          {!tier || me.membershipStatus !== "active" ? (
            <Link href="/" className={`${btnSecondary} mt-4`}>
              Choose a membership
            </Link>
          ) : null}
          <p className="mt-4 text-xs text-stone-500">
            Verification is done by an SoV admin after a conversation with you. We never ask for your SSN or discharge documents.
          </p>
        </Card>

        <Card>
          <SectionTitle>Contact details (private)</SectionTitle>
          <form action={updateAccount} className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Full name</span>
              <input className={inputCls} name="name" required minLength={2} maxLength={80} defaultValue={me.name ?? ""} />
            </label>
            <label className="block">
              <span className={labelCls}>Email</span>
              <input className={`${inputCls} opacity-70`} value={me.email} readOnly aria-readonly />
            </label>
            <label className="block">
              <span className={labelCls}>Phone</span>
              <input className={inputCls} name="phone" type="tel" maxLength={30} defaultValue={me.phone ?? ""} />
            </label>
            <p className="text-xs text-stone-500 sm:col-span-2">
              Only SoV staff can see your email and phone. Other members never do. Your public name is set on{" "}
              <Link href="/record" className="text-amber-400 hover:text-amber-300">
                My Service Record
              </Link>
              .
            </p>
            <div className="sm:col-span-2">
              <button type="submit" className={btnPrimary}>
                Save
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <SectionTitle>Blocked members</SectionTitle>
          {blocks.length ? (
            <ul className="divide-y divide-stone-800">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-stone-200">{b.blocked.profile?.displayName ?? b.blocked.name}</span>
                  <form action={unblockMember}>
                    <input type="hidden" name="userId" value={b.blocked.id} />
                    <input type="hidden" name="returnTo" value="/account" />
                    <button type="submit" className={btnGhost}>
                      Unblock
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-400">You haven&apos;t blocked anyone.</p>
          )}
        </Card>

        <form action={signOutAction}>
          <button type="submit" className={btnSecondary}>
            Sign out
          </button>
        </form>
      </div>
    </Container>
  );
}
