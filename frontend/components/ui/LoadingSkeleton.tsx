// Loading skeleton components for table and stat cards

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#E4E7EC] rounded-lg p-5">
      <SkeletonBlock className="h-3 w-24 mb-3" />
      <SkeletonBlock className="h-7 w-16 mb-2" />
      <SkeletonBlock className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-32 mb-1.5" />
        <SkeletonBlock className="h-3 w-40" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-24" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-12" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-5 w-16 rounded" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-28" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-5 w-20 rounded" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-5 w-16 rounded" />
      </td>
      <td className="px-4 py-3">
        <SkeletonBlock className="h-4 w-16" />
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  );
}

export function LeadDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <SkeletonBlock className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3.5 w-52" />
          <SkeletonBlock className="h-3.5 w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-3/4" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({
  type,
  rows = 6,
}: {
  type: 'stats' | 'table' | 'detail';
  rows?: number;
}) {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (type === 'detail') {
    return <LeadDetailSkeleton />;
  }

  return (
    <table className="w-full">
      <tbody>
        <TableSkeleton rows={rows} />
      </tbody>
    </table>
  );
}

