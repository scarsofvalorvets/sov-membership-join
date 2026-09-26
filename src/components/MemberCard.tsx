import Link from "next/link";
import { Avatar, VerifiedBadge } from "@/components/ui";
import { branchLabel, stateLabel } from "@/lib/constants";
import { formatYears } from "@/lib/dates";
import { mediaUrl } from "@/lib/storage";
import { visibleSections, type Audience, type ProfilePrivacy } from "@/lib/visibility";

type CardProfile = ProfilePrivacy & {
  userId: string;
  displayName: string;
  photoKey: string | null;
  branch: string | null;
  rank: string | null;
  state: string | null;
  hometown: string | null;
  serviceStartYear: number | null;
  serviceEndYear: number | null;
};

export default function MemberCard({
  profile,
  audience,
  verified,
  extra,
}: {
  profile: CardProfile;
  audience: Audience;
  verified: boolean;
  extra?: string;
}) {
  const show = visibleSections(profile, audience);
  const line1 = show.service ? [profile.rank, branchLabel(profile.branch)].filter(Boolean).join(" · ") : "";
  const line2 = [
    show.years ? formatYears(profile.serviceStartYear, profile.serviceEndYear) : "",
    show.location ? stateLabel(profile.state) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={`/members/${profile.userId}`}
      className="flex items-center gap-4 rounded-xl border border-stone-700/80 bg-stone-900/40 p-4 transition hover:border-amber-500/60 hover:bg-stone-900/70"
    >
      <Avatar name={profile.displayName} src={show.photo ? mediaUrl(profile.photoKey) : null} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-semibold text-stone-100">{profile.displayName}</span>
          {verified ? <VerifiedBadge /> : null}
        </div>
        {line1 ? <p className="truncate text-sm text-amber-300/90">{line1}</p> : null}
        {line2 ? <p className="truncate text-xs text-stone-400">{line2}</p> : null}
        {extra ? <p className="truncate text-xs text-stone-400">{extra}</p> : null}
      </div>
    </Link>
  );
}
