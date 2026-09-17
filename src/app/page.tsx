import JoinForm from "@/components/JoinForm";
import { MEMBERSHIP_TIERS } from "@/lib/tiers";

export default function HomePage() {
  const freeTiers = MEMBERSHIP_TIERS.filter((t) => t.isFree);
  const paidTiers = MEMBERSHIP_TIERS.filter((t) => !t.isFree);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-10 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
          Membership
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-stone-50 sm:text-4xl">
          Join Scars of Valor Foundation
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-400 sm:text-lg">
          Stand with a community that honors service, strengthens legacy, and
          supports those who have given so much. Choose a complimentary tier if
          you are a Veteran or First Responder, or an annual membership that
          fuels the mission.
        </p>
      </section>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
            Complimentary
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-300">
            {freeTiers.map((t) => (
              <li key={t.id}>
                <span className="font-medium text-stone-100">{t.name}</span>
                {" — "}
                {t.priceLabel}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-stone-700/80 bg-stone-900/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
            Annual memberships
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-300">
            {paidTiers.map((t) => (
              <li key={t.id}>
                <span className="font-medium text-stone-100">{t.name}</span>
                {" — "}
                {t.priceLabel}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-700/80 bg-stone-950/50 p-5 shadow-xl shadow-black/20 sm:p-8">
        <h2 className="mb-6 text-xl font-semibold text-stone-50">
          Membership application
        </h2>
        <JoinForm />
      </section>
    </div>
  );
}
