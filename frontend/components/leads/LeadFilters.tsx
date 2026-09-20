'use client';

export type SortOption = 'newest' | 'oldest' | 'score_desc' | 'score_asc';
export type StatusFilter = 'all' | 'qualified' | 'contacted' | 'pending' | 'rejected' | 'spam';
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

export interface FilterState {
  search: string;
  status: StatusFilter;
  priority: PriorityFilter;
  sort: SortOption;
}

export interface LeadFiltersProps {
  // Structured state mode
  filters?: FilterState;
  onFiltersChange?: (filters: FilterState) => void;
  onRefresh?: () => void;
  total?: number;
  filtered?: number;
  loading?: boolean;

  // Individual props mode
  search?: string;
  onSearchChange?: (search: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  priorityFilter?: string;
  onPriorityChange?: (priority: string) => void;
  sortBy?: string;
  sortOption?: string;
  onSortChange?: (sort: string) => void;
  onReset?: () => void;
}

function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10 10l3.5 3.5" />
    </svg>
  );
}

function IconRefresh({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 6A5.5 5.5 0 1 0 14 9" />
      <path d="M14 3v3h-3" />
    </svg>
  );
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'spam', label: 'Spam' },
];

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'score_desc', label: 'Highest score' },
  { value: 'score_asc', label: 'Lowest score' },
];

const selectClass =
  'text-sm border border-[#E4E7EC] rounded-md px-2.5 py-1.5 bg-white text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all cursor-pointer';

export default function LeadFilters({
  filters,
  onFiltersChange,
  onRefresh,
  total,
  filtered,
  loading,

  search: directSearch,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  sortBy,
  sortOption,
  onSortChange,
  onReset,
}: LeadFiltersProps) {
  const currentSearch = filters?.search ?? directSearch ?? '';
  const currentStatus = filters?.status ?? statusFilter ?? 'all';
  const currentPriority = filters?.priority ?? priorityFilter ?? 'all';
  const currentSort = filters?.sort ?? sortBy ?? sortOption ?? 'newest';

  const hasActiveFilters =
    currentSearch !== '' ||
    currentStatus !== 'all' ||
    currentPriority !== 'all' ||
    currentSort !== 'newest';

  function handleSearchChange(val: string) {
    if (onSearchChange) onSearchChange(val);
    if (filters && onFiltersChange) onFiltersChange({ ...filters, search: val });
  }

  function handleStatusChange(val: string) {
    if (onStatusChange) onStatusChange(val);
    if (filters && onFiltersChange) onFiltersChange({ ...filters, status: val as StatusFilter });
  }

  function handlePriorityChange(val: string) {
    if (onPriorityChange) onPriorityChange(val);
    if (filters && onFiltersChange) onFiltersChange({ ...filters, priority: val as PriorityFilter });
  }

  function handleSortChange(val: string) {
    if (onSortChange) onSortChange(val);
    if (filters && onFiltersChange) onFiltersChange({ ...filters, sort: val as SortOption });
  }

  function handleReset() {
    if (onReset) onReset();
    if (filters && onFiltersChange) {
      onFiltersChange({ search: '', status: 'all', priority: 'all', sort: 'newest' });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#98A2B3] pointer-events-none">
          <IconSearch />
        </span>
        <input
          type="text"
          placeholder="Search name, email, company…"
          value={currentSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-sm bg-white border border-[#E4E7EC] rounded-md text-[#111827] placeholder-[#98A2B3] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB] transition-all w-56"
        />
      </div>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={currentPriority}
        onChange={(e) => handlePriorityChange(e.target.value)}
        className={selectClass}
      >
        {PRIORITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className={selectClass}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="text-sm text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
        >
          Reset
        </button>
      )}

      {/* Count */}
      {total != null && filtered != null && !loading && (
        <span className="text-xs text-[#98A2B3] ml-1">
          {filtered === total ? `${total} leads` : `${filtered} of ${total}`}
        </span>
      )}

      {/* Refresh */}
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 text-sm border border-[#E4E7EC] rounded-md text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <IconRefresh />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      )}
    </div>
  );
}
