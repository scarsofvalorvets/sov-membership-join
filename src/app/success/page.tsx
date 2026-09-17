import Link from "next/link";

type SearchParams = Promise<{ session_id?: string }>;

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-2xl text-emerald-400">
        ✓
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-50">
        Welcome to Scars of Valor
      </h1>
      <p className="mt-4 text-base leading-relaxed text-stone-400">
        Thank you for your membership. Your payment was processed securely
        through Stripe. You will receive a receipt from Stripe at the email you
        provided.
      </p>
      {sessionId ? (
        <p className="mt-3 break-all text-xs text-stone-600">
          Reference: {sessionId}
        </p>
      ) : null}
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg border border-stone-600 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-100 transition hover:border-amber-500 hover:text-amber-300"
      >
        Return home
      </Link>
    </div>
  );
}
