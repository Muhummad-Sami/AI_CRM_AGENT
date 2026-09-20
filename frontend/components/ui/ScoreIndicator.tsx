import { getScoreColor, getScoreBarColor } from '@/lib/utils';

interface ScoreIndicatorProps {
  score?: number | null;
  showBar?: boolean;
}

export default function ScoreIndicator({ score, showBar = true }: ScoreIndicatorProps) {
  if (score == null) {
    return <span className="text-[#98A2B3] text-sm">—</span>;
  }

  const pct = Math.min(100, Math.max(0, score));

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold tabular-nums ${getScoreColor(score)}`}>
        {score}
      </span>
      {showBar && (
        <div
          className="relative rounded-full overflow-hidden flex-shrink-0"
          style={{ width: 48, height: 4, backgroundColor: '#E4E7EC' }}
        >
          <div
            className={`absolute left-0 top-0 bottom-0 rounded-full ${getScoreBarColor(score)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
