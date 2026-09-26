import Link from "next/link";

type SearchParams = Promise<{ session_id?: string; dev?: string; tier?: string; email?: string }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const devMode = params.dev === "1";
  const signinHref = `/signin${params.email ? `?email=${encodeURIComponent(params.email)}` : ""}`;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-2xl text-emerald-400">
        ✓
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-50">
        Welcome to Scars of Valor
      </h1>
      {devMode ? (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-200">
          Development mode: Stripe is not configured, so no checkout was
          started and no charge was made. Your{params.tier ? ` ${params.tier}` : ""} membership
          is recorded as payment pending.
        </p>
      ) : (
        <p className="mt-4 text-base leading-relaxed text-stone-400">
          Thank you for your membership. Your payment was processed securely
          through Stripe. You will receive a receipt from Stripe at the email you
          provided.
        </p>
      )}
      {sessionId ? (
        <p className="mt-3 break-all text-xs text-stone-600">
          Reference: {sessionId}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={signinHref}
          className="inline-flex rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
        >
          Sign in to the registry
        </Link>
        <Link
          href="/"
          className="inline-flex rounded-lg border border-stone-600 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-100 transition hover:border-amber-500 hover:text-amber-300"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
