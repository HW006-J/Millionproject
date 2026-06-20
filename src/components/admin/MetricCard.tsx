interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

export function MetricCard({ label, value, sublabel }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-neutral-800 p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-white">{value}</p>
      {sublabel && <p className="text-xs text-neutral-500">{sublabel}</p>}
    </div>
  );
}
