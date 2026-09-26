import Link from "next/link";
import JoinForm from "@/components/JoinForm";
import { MEMBERSHIP_TIERS } from "@/lib/tiers";

const REGISTRY_FEATURES = [
  {
    title: "Your service record",
    text: "Branch or agency, units, deployments, and awards, in your own words. You decide who sees it.",
  },
  {
    title: "Find your people",
    text: "Search the directory and unit rosters for the men and women you served with.",
  },
  {
    title: "Reconnect privately",
    text: "Message members inside the registry. Your email and phone are never shared.",
  },
];

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
          fuels the mission. Every membership includes access to the SoV member
          registry.
        </p>
      </section>

      <section className="mb-10 grid gap-4 sm:grid-cols-3" aria-label="Member registry">
        {REGISTRY_FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-blue-900/60 bg-gradient-to-b from-blue-950/40 to-stone-950/40 p-5"
          >
            <h2 className="text-sm font-semibold text-amber-300">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">{f.text}</p>
          </div>
        ))}
        <p className="text-sm text-stone-500 sm:col-span-3">
          Already a member?{" "}
          <Link href="/signin" className="font-medium text-amber-400 hover:text-amber-300">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/directory" className="font-medium text-amber-400 hover:text-amber-300">
            browse the directory
          </Link>
          .
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
