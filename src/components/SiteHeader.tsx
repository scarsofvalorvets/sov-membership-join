import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { unreadCount } from "@/lib/messaging";
import { signOutAction } from "@/app/actions/auth";
import UnreadBadge from "@/components/UnreadBadge";

const linkCls =
  "whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-stone-300 transition hover:bg-stone-800/80 hover:text-amber-300";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadCount(user.id) : 0;

  return (
    <header className="border-b border-stone-800/80 bg-stone-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-sm font-bold tracking-tight text-amber-400">
            SoV
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide text-stone-50 group-hover:text-amber-300">
              Scars of Valor Foundation
            </span>
            <span className="block text-xs text-stone-500">Member Registry</span>
          </span>
        </Link>

        <nav
          aria-label="Main"
          className="-mx-1 flex w-full items-center gap-0.5 overflow-x-auto pb-1 sm:w-auto sm:pb-0"
        >
          <Link href="/directory" className={linkCls}>
            Directory
          </Link>
          <Link href="/units" className={linkCls}>
            Units
          </Link>
          <Link href="/looking-for" className={linkCls}>
            Looking For
          </Link>
          {user ? (
            <>
              <Link href="/messages" className={`${linkCls} relative`}>
                Messages
                <UnreadBadge initial={unread} />
              </Link>
              <Link href="/record" className={linkCls}>
                My Record
              </Link>
              {user.role === "admin" ? (
                <Link href="/admin" className={`${linkCls} text-amber-400`}>
                  Admin
                </Link>
              ) : null}
              <Link href="/account" className={linkCls}>
                Account
              </Link>
              <form action={signOutAction}>
                <button type="submit" className={linkCls}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin" className={linkCls}>
                Sign in
              </Link>
              <Link
                href="/"
                className="ml-1 whitespace-nowrap rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-stone-950 hover:bg-amber-400"
              >
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
