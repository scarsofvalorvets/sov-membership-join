import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-2xl text-amber-400">
        !
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-50">
        Checkout canceled
      </h1>
      <p className="mt-4 text-base leading-relaxed text-stone-400">
        No charge was made. You can return to the membership form whenever you
        are ready to join Scars of Valor Foundation.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 transition hover:bg-amber-400"
      >
        Back to join form
      </Link>
    </div>
  );
}
