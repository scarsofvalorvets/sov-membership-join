import { blockMember, reportContent } from "@/app/actions/safety";
import { btnGhost, btnPrimary, inputCls } from "@/components/ui";
import type { ReportTarget } from "@/lib/constants";

export function ReportForm({
  targetType,
  targetId,
  returnTo,
  label = "Report",
}: {
  targetType: ReportTarget;
  targetId: string;
  returnTo: string;
  label?: string;
}) {
  return (
    <details className="group relative inline-block">
      <summary className={`${btnGhost} cursor-pointer list-none`}>{label}</summary>
      <form
        action={reportContent}
        className="absolute right-0 z-20 mt-1 w-72 space-y-2 rounded-xl border border-stone-700 bg-stone-950 p-3 shadow-xl"
      >
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="block text-xs text-stone-400">
          What&apos;s wrong? An admin will review.
          <textarea name="reason" required maxLength={1000} className={`${inputCls} mt-1 min-h-20`} />
        </label>
        <button type="submit" className={`${btnPrimary} w-full`}>
          Send report
        </button>
      </form>
    </details>
  );
}

export function BlockForm({ userId, returnTo }: { userId: string; returnTo: string }) {
  return (
    <form action={blockMember} className="inline">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button type="submit" className={btnGhost}>
        Block
      </button>
    </form>
  );
}
