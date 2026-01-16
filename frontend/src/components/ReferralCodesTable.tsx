import { useState, useMemo } from "react";
import type { ReferralCode } from "../types";
import TableFilters from "./TableFilters";
import { useToast } from "./ToastProvider";
import { formatCurrency } from "../config/commission";
import { filterItems, sortItems, toggleSortDirection } from "../utils/filters";
import type { SortConfig } from "../utils/filters";

interface ReferralCodesTableProps {
  codes: ReferralCode[];
}

/** Event column metadata for dynamic rendering */
interface EventColumn {
  eventName: string;
  displayName: string;
}

/**
 * Format event name for display (fallback when no display_name available)
 * e.g., "3_meals_logged" -> "3 Meals Logged"
 */
function formatEventName(eventName: string): string {
  return eventName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build union of all event columns from all referral codes' commission configs
 * Returns array of unique events with their display names
 * Note: Excludes "signup" since Referrals column already shows that count
 */
function buildEventColumns(codes: ReferralCode[]): EventColumn[] {
  const eventMap = new Map<string, string>(); // eventName -> displayName

  for (const code of codes) {
    for (const config of code.commissionConfig || []) {
      // Skip "signup" event - it's the same as referrals count
      if (
        config.event &&
        config.event.toLowerCase() !== "signup" &&
        !eventMap.has(config.event)
      ) {
        eventMap.set(
          config.event,
          config.display_name || formatEventName(config.event)
        );
      }
    }
  }

  // Convert to array and sort for consistent ordering
  return Array.from(eventMap.entries())
    .map(([eventName, displayName]) => ({ eventName, displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export default function ReferralCodesTable({ codes }: ReferralCodesTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">(
    "all"
  );
  const [commissionFilter, setCommissionFilter] = useState<
    "all" | "with" | "without"
  >("all");
  const [sortConfig, setSortConfig] = useState<SortConfig<ReferralCode> | null>(
    null
  );
  const { addToast } = useToast();

  // Build dynamic event columns from all codes' commission configs (union)
  const eventColumns = useMemo(() => buildEventColumns(codes), [codes]);

  // Filter and sort codes
  const filteredAndSortedCodes = useMemo(() => {
    let result = [...codes];
    // console.log("Initial codes:", result);

    // Apply search filter
    if (searchTerm) {
      result = filterItems(result, searchTerm, ["code"]);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((code) => code.status === statusFilter);
    }

    // Apply usage filter (used = has signups/referrals)
    if (usageFilter !== "all") {
      result = result.filter((code) => {
        const hasSignups = (code.eventStats?.signup ?? 0) > 0;
        return usageFilter === "used" ? hasSignups : !hasSignups;
      });
    }

    // Apply commission filter
    if (commissionFilter !== "all") {
      result = result.filter((code) => {
        const hasCommission =
          code.commissionConfig &&
          code.commissionConfig.length > 0 &&
          code.commissionConfig.some((rule) => rule.rate > 0);
        return commissionFilter === "with" ? hasCommission : !hasCommission;
      });
    }

    // Apply sorting
    if (sortConfig) {
      result = sortItems(result, sortConfig);
    }

    return result;
  }, [
    codes,
    searchTerm,
    statusFilter,
    usageFilter,
    commissionFilter,
    sortConfig,
  ]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current && (current.key as any) === key) {
        return {
          key: key as keyof ReferralCode,
          direction: toggleSortDirection(current.direction),
        };
      }
      return { key: key as keyof ReferralCode, direction: "asc" };
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig?.key !== (key as any)) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setUsageFilter("all");
    setCommissionFilter("all");
    setSortConfig(null);
  };

  const hasActiveFilters = !!(
    searchTerm ||
    statusFilter !== "all" ||
    usageFilter !== "all" ||
    commissionFilter !== "all" ||
    sortConfig
  );

  // const handleViewUsers = async (code: string) => {
  //   try {
  //     setLoadingUsers(true);
  //     const response = await apiService.getReferralDetails(code);
  //     if (response.success && response.data) {
  //       setUsers(response.data);
  //       setSelectedCode(code);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching users:', error);
  //   } finally {
  //     setLoadingUsers(false);
  //   }
  // };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      addToast("Referral code copied to clipboard", { type: "success" });
    } catch (error) {
      console.error("Failed to copy referral code", error);
      addToast("Could not copy code. Please try again.", { type: "error" });
    }
  };

  // Calculate total columns for colspan (fixed columns + dynamic event columns)
  const totalColumns = 6 + eventColumns.length; // Code, Created, Referrals, [events...], Total Conversions, Earnings, Status, Actions

  return (
    <div className="referral-codes-section">
      <div className="section-header">
        <h2 className="section-title">
          My Referral Codes ({filteredAndSortedCodes.length})
        </h2>
        {codes.length >= 10 && (
          <TableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            usageFilter={usageFilter}
            onUsageFilterChange={setUsageFilter}
            commissionFilter={commissionFilter}
            onCommissionFilterChange={setCommissionFilter}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        )}
      </div>
      <div className="table-container">
        <table className="referral-codes-table">
          <thead>
            <tr>
              {/* Fixed columns */}
              <th onClick={() => handleSort("code")} className="sortable">
                Referral Code {getSortIcon("code")}
              </th>
              <th onClick={() => handleSort("createdAt")} className="sortable">
                Created {getSortIcon("createdAt")}
              </th>
              <th onClick={() => handleSort("signups")} className="sortable">
                Signups {getSortIcon("signups")}
              </th>

              {/* Dynamic event columns based on commission configs */}
              {eventColumns.map((col) => (
                <th key={col.eventName} className="event-column">
                  {col.displayName}
                </th>
              ))}

              {/* More fixed columns */}
              {/* <th
                onClick={() => handleSort("totalConversions")}
                className="sortable"
              >
                Total Conversions {getSortIcon("totalConversions")}
              </th> */}
              <th onClick={() => handleSort("earnings")} className="sortable">
                Earnings {getSortIcon("earnings")}
              </th>
              <th onClick={() => handleSort("status")} className="sortable">
                Status {getSortIcon("status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCodes.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="no-results">
                  No referral codes found
                </td>
              </tr>
            ) : (
              filteredAndSortedCodes.map((code) => (
                <tr key={code.id}>
                  {/* Fixed columns */}
                  <td>
                    <div className="code-cell">
                      <code className="referral-code">{code.code}</code>
                      <button
                        className="copy-button"
                        onClick={() => handleCopyCode(code.code)}
                        title="Copy code"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td>{formatDate(code.createdAt)}</td>
                  <td>{(code.eventStats?.signup ?? 0).toLocaleString()}</td>

                  {/* Dynamic event columns - show count from eventStats or "-" if not configured */}
                  {eventColumns.map((col) => {
                    // Check if this code has this event in its commission config
                    const hasEvent = code.commissionConfig?.some(
                      (c) => c.event === col.eventName
                    );
                    const count = code.eventStats?.[col.eventName] ?? 0;

                    return (
                      <td key={col.eventName} className="event-cell">
                        {hasEvent ? count.toLocaleString() : "-"}
                      </td>
                    );
                  })}

                  {/* More fixed columns */}
                  {/* <td>
                    {Object.values(code.eventStats || {})
                      .reduce((sum, c) => sum + c, 0)
                      .toLocaleString()}
                  </td> */}
                  <td className="earnings-cell">
                    {code.earnings
                      ? formatCurrency(
                          code.earnings.total,
                          code.earnings.currency
                        )
                      : "$0.00"}
                  </td>
                  <td>
                    <span className={`status-badge ${code.status}`}>
                      {code.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
