import type { Metadata } from "next";
import Link from "next/link";
import { emailConfigured } from "@/lib/email";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-2xl text-amber-400">
        ✉
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-stone-50">Check your email</h1>
      <p className="mt-4 text-base leading-relaxed text-stone-400">
        If that address belongs to a member, a sign-in link is on its way. The link works once and expires in 24 hours.
      </p>
      {!emailConfigured() ? (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Local dev: no email server is configured. Copy the link from the server console.
        </p>
      ) : null}
      <p className="mt-6 text-sm text-stone-500">
        Not a member yet?{" "}
        <Link href="/" className="font-medium text-amber-400 hover:text-amber-300">
          Join first
        </Link>
        . It&apos;s free for Veterans and First Responders.
      </p>
      <Link href="/signin" className="mt-4 text-sm font-medium text-amber-400 hover:text-amber-300">
        Use a different email
      </Link>
    </div>
  );
}
