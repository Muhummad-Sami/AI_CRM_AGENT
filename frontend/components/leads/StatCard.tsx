interface StatCardProps {
  label?: string;
  title?: string;
  value: number | string;
  sub?: string;
  description?: string;
  trend?: string;
  valueColor?: string;
}

export default function StatCard({
  label,
  title,
  value,
  sub,
  description,
  trend,
  valueColor,
}: StatCardProps) {
  const displayLabel = title ?? label ?? '';
  const displaySub = description ?? sub;

  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg px-5 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#667085] uppercase tracking-wide">
          {displayLabel}
        </p>
        {trend && (
          <span className="text-[11px] font-medium text-[#16A34A] bg-[#F0FDF4] px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      <p
        className="text-2xl font-semibold tabular-nums leading-none"
        style={{ color: valueColor ?? '#111827' }}
      >
        {value}
      </p>
      {displaySub && (
        <p className="text-xs text-[#98A2B3] mt-1.5">{displaySub}</p>
      )}
    </div>
  );
}
