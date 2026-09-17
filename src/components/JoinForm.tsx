"use client";

import { useMemo, useState, type FormEvent } from "react";
import { MEMBERSHIP_TIERS, type TierId } from "@/lib/tiers";

type Status = "idle" | "submitting" | "error";

export default function JoinForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tier, setTier] = useState<TierId>("community_supporter");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => MEMBERSHIP_TIERS.find((t) => t.id === tier),
    [tier]
  );
  const showNote = selected?.isFree === true;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          tier,
          note: showNote ? note || undefined : undefined,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        redirectUrl?: string;
      };

      if (!res.ok || !data.redirectUrl) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      setStatus("error");
      setError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-stone-200">
            Full name <span className="text-amber-400">*</span>
          </span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-600 bg-stone-900/80 px-3.5 py-2.5 text-stone-100 placeholder:text-stone-500 outline-none ring-amber-500/40 transition focus:border-amber-500 focus:ring-2"
            placeholder="Jordan Smith"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-200">
            Email <span className="text-amber-400">*</span>
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-600 bg-stone-900/80 px-3.5 py-2.5 text-stone-100 placeholder:text-stone-500 outline-none ring-amber-500/40 transition focus:border-amber-500 focus:ring-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-200">
            Phone <span className="text-stone-500">(optional)</span>
          </span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-stone-600 bg-stone-900/80 px-3.5 py-2.5 text-stone-100 placeholder:text-stone-500 outline-none ring-amber-500/40 transition focus:border-amber-500 focus:ring-2"
            placeholder="(555) 555-5555"
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-stone-200">
          Membership tier <span className="text-amber-400">*</span>
        </legend>
        <div className="grid gap-3">
          {MEMBERSHIP_TIERS.map((t) => {
            const active = tier === t.id;
            return (
              <label
                key={t.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  active
                    ? "border-amber-500 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]"
                    : "border-stone-600 bg-stone-900/50 hover:border-stone-500"
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={t.id}
                  checked={active}
                  onChange={() => setTier(t.id)}
                  className="mt-1 h-4 w-4 accent-amber-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold text-stone-50">{t.name}</span>
                    <span
                      className={`text-sm font-medium ${
                        t.isFree ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {t.priceLabel}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-stone-400">
                    {t.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {showNote && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-200">
            Service note <span className="text-stone-500">(optional)</span>
          </span>
          <textarea
            name="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-y rounded-lg border border-stone-600 bg-stone-900/80 px-3.5 py-2.5 text-stone-100 placeholder:text-stone-500 outline-none ring-amber-500/40 transition focus:border-amber-500 focus:ring-2"
            placeholder="Branch, years of service, department, or anything you'd like us to know."
          />
        </label>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-full items-center justify-center rounded-lg bg-amber-500 px-5 py-3 text-base font-semibold text-stone-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[220px]"
      >
        {status === "submitting"
          ? "Processing…"
          : selected?.isFree
            ? "Complete free membership"
            : "Continue to secure checkout"}
      </button>

      <p className="text-xs leading-relaxed text-stone-500">
        Scars of Valor Foundation is a 501(c)(3) nonprofit organization. Paid
        memberships are processed securely by Stripe. Free Veteran and First
        Responder memberships are recorded without a charge.
      </p>
    </form>
  );
}
