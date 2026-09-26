import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { devLoginEnabled } from "@/auth";
import { devSignIn, signInWithEmail } from "@/app/actions/auth";
import { Container, Card, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { emailConfigured } from "@/lib/email";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  InvalidEmail: "Enter a valid email address.",
  Verification: "That sign-in link is expired or was already used. Request a new one.",
  DevLogin: "No seeded account with that email.",
  AccessDenied: "Sign-in was not allowed for that account.",
};

export default async function SignInPage(props: PageProps<"/signin">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/record";
  const email = typeof sp.email === "string" ? sp.email : "";
  const error = typeof sp.error === "string" ? sp.error : null;

  if (await getCurrentUser()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/record");

  const devAccounts = devLoginEnabled
    ? await prisma.user.findMany({
        where: { email: { endsWith: "@example.org" } },
        select: { email: true, name: true, role: true },
        orderBy: [{ role: "asc" }, { email: "asc" }],
        take: 6,
      })
    : [];

  return (
    <Container narrow>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold tracking-tight text-stone-50">Sign in</h1>
        <p className="mt-2 text-sm text-stone-400">
          Enter the email you joined with. We&apos;ll send a one-time sign-in link. No password to remember.
        </p>

        {error ? (
          <div role="alert" className="mt-6 rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {ERRORS[error] ?? "Sign-in failed. Try again."}
          </div>
        ) : null}

        <Card className="mt-6">
          <form action={signInWithEmail} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <label className="block">
              <span className={labelCls}>Email</span>
              <input
                className={inputCls}
                type="email"
                name="email"
                required
                autoComplete="email"
                defaultValue={email}
                placeholder="you@example.com"
              />
            </label>
            <button type="submit" className={`${btnPrimary} w-full`}>
              Email me a sign-in link
            </button>
          </form>
          {!emailConfigured() ? (
            <p className="mt-4 text-xs text-stone-500">
              Local dev: email is not configured, so the link is printed in the server console instead of sent.
            </p>
          ) : null}
        </Card>

        {devLoginEnabled ? (
          <Card className="mt-6 border-dashed border-amber-500/40">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">Dev login (local only)</h2>
            <p className="mt-1 text-xs text-stone-500">
              Enabled by AUTH_DEV_LOGIN=true outside production. Signs in as a seeded example account without email.
            </p>
            <form action={devSignIn} className="mt-4 flex gap-2">
              <input type="hidden" name="next" value={next} />
              <input
                className={inputCls}
                type="email"
                name="email"
                required
                defaultValue={email || devAccounts[0]?.email || ""}
                aria-label="Seeded account email"
              />
              <button type="submit" className={btnSecondary}>
                Sign in
              </button>
            </form>
            {devAccounts.length ? (
              <ul className="mt-3 space-y-1 text-xs text-stone-400">
                {devAccounts.map((a) => (
                  <li key={a.email}>
                    <code className="text-stone-300">{a.email}</code> — {a.name}
                    {a.role === "admin" ? " (admin)" : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}

        <p className="mt-6 text-center text-sm text-stone-500">
          Not a member yet?{" "}
          <Link href="/" className="font-medium text-amber-400 hover:text-amber-300">
            Join Scars of Valor
          </Link>
        </p>
      </div>
    </Container>
  );
}
