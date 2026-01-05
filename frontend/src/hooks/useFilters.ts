import { useState, useMemo } from 'react';
import type { SortConfig, SortDirection } from '../utils/filters';
import { filterItems, sortItems, filterByDateRange } from '../utils/filters';

interface UseFiltersOptions<T> {
  searchKeys?: (keyof T)[];
  dateKey?: keyof T;
}

export function useFilters<T>(items: T[], options: UseFiltersOptions<T> = {}) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...items];

    // Apply search filter
    if (searchTerm && options.searchKeys) {
      result = filterItems(result, searchTerm, options.searchKeys);
    }

    // Apply date range filter
    if (options.dateKey && (startDate || endDate)) {
      result = filterByDateRange(result, options.dateKey, startDate, endDate);
    }

    // Apply sorting
    if (sortConfig) {
      result = sortItems(result, sortConfig);
    }

    return result;
  }, [items, searchTerm, sortConfig, startDate, endDate, options.searchKeys, options.dateKey]);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortConfig(null);
    setStartDate(null);
    setEndDate(null);
  };

  return {
    filteredItems: filteredAndSorted,
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilters,
    hasActiveFilters: !!(searchTerm || sortConfig || startDate || endDate),
  };
}

