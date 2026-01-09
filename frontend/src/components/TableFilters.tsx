interface TableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  usageFilter?: "all" | "used" | "unused";
  onUsageFilterChange?: (value: "all" | "used" | "unused") => void;
  commissionFilter?: "all" | "with" | "without";
  onCommissionFilterChange?: (value: "all" | "with" | "without") => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function TableFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  usageFilter,
  onUsageFilterChange,
  // commissionFilter,
  // onCommissionFilterChange,
  onClearFilters,
  hasActiveFilters,
}: TableFiltersProps) {
  return (
    <div className="table-filters">
      <div className="filter-group">
        <input
          type="text"
          placeholder="Search referral codes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="filter-group">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="exhausted">Exhausted</option>
        </select>
      </div>
      {usageFilter && onUsageFilterChange && (
        <div className="filter-group">
          <select
            value={usageFilter}
            onChange={(e) =>
              onUsageFilterChange(e.target.value as "all" | "used" | "unused")
            }
            className="filter-select"
          >
            <option value="all">All Codes</option>
            <option value="used">Active (has signups)</option>
            <option value="unused">Inactive (no signups)</option>
          </select>
        </div>
      )}
      {/* {commissionFilter && onCommissionFilterChange && (
        <div className="filter-group">
          <select
            value={commissionFilter}
            onChange={(e) =>
              onCommissionFilterChange(
                e.target.value as "all" | "with" | "without"
              )
            }
            className="filter-select"
          >
            <option value="all">All Commission Settings</option>
            <option value="with">Active Commission Rates</option>
            <option value="without">No Commission Configured</option>
          </select>
        </div>
      )} */}
      {hasActiveFilters && (
        <button onClick={onClearFilters} className="clear-filters-button">
          Clear Filters
        </button>
      )}
    </div>
  );
}
