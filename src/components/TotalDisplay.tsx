import { TARGET_CENTS, formatCents, formatCentsWhole } from "@/lib/money";

interface TotalDisplayProps {
  confirmedCents: number;
}

export function TotalDisplay({ confirmedCents }: TotalDisplayProps) {
  const percent = Math.min(100, (confirmedCents / TARGET_CENTS) * 100);
  const percentLabel = percent.toFixed(percent > 0 && percent < 1 ? 2 : 0);

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      <p
        className="text-6xl font-bold tracking-tight tabular-nums sm:text-7xl md:text-8xl"
        aria-live="polite"
      >
        {formatCents(confirmedCents)}
      </p>
      <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
        raised of {formatCentsWhole(TARGET_CENTS)}
      </p>

      <div className="mt-4 w-full max-w-md">
        <div
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-neutral-800"
        >
          <div
            className="h-full rounded-full bg-white transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-neutral-500">{percentLabel}% complete</p>
      </div>
    </div>
  );
}
