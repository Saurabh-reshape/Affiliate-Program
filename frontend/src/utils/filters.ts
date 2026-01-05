// Filter and Sort Utilities

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

/**
 * Generic filter function
 */
export function filterItems<T>(
  items: T[],
  searchTerm: string,
  searchKeys: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;

  const lowerSearch = searchTerm.toLowerCase();
  return items.filter((item) =>
    searchKeys.some((key) => {
      const value = item[key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    })
  );
}

/**
 * Generic sort function
 */
export function sortItems<T>(
  items: T[],
  sortConfig: SortConfig<T> | null
): T[] {
  if (!sortConfig) return items;

  return [...items].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested objects (e.g., earnings.total)
    if (typeof aValue === 'object' && aValue !== null && 'total' in aValue) {
      aValue = (aValue as any).total;
    }
    if (typeof bValue === 'object' && bValue !== null && 'total' in bValue) {
      bValue = (bValue as any).total;
    }

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Compare values
    let comparison = 0;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else {
      comparison = String(aValue).localeCompare(String(bValue));
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter by date range
 * Supports both string dates and timestamp numbers
 */
export function filterByDateRange<T>(
  items: T[],
  dateKey: keyof T,
  startDate: string | null,
  endDate: string | null
): T[] {
  if (!startDate && !endDate) return items;

  const startTimestamp = startDate ? new Date(startDate).getTime() : null;
  const endTimestamp = endDate ? new Date(endDate).getTime() + 86400000 : null; // Add 1 day to include end date

  return items.filter((item) => {
    const dateValue = item[dateKey];
    if (!dateValue) return false;

    let timestamp: number;
    if (typeof dateValue === 'number') {
      timestamp = dateValue;
    } else if (typeof dateValue === 'string') {
      timestamp = new Date(dateValue).getTime();
    } else {
      timestamp = new Date(dateValue as any).getTime();
    }

    if (startTimestamp && timestamp < startTimestamp) return false;
    if (endTimestamp && timestamp > endTimestamp) return false;
    return true;
  });
}

/**
 * Toggle sort direction
 */
export function toggleSortDirection(current: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc';
}

