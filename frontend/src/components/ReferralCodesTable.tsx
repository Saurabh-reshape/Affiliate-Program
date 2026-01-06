import { useState, useMemo } from "react";
import type { ReferralCode } from "../types";
import UserListModal from "./UserListModal";
import ReferralCodeDetailView from "./ReferralCodeDetailView";
import TableFilters from "./TableFilters";
import { useToast } from "./ToastProvider";
import { formatCurrency } from "../config/commission";
import { getCommissionRates } from "../config/commission";
import { filterItems, sortItems, toggleSortDirection } from "../utils/filters";
import type { SortConfig } from "../utils/filters";

interface ReferralCodesTableProps {
  codes: ReferralCode[];
}

export default function ReferralCodesTable({ codes }: ReferralCodesTableProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedCodeDetail, setSelectedCodeDetail] =
    useState<ReferralCode | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  // const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig<ReferralCode> | null>(
    null
  );
  const { addToast } = useToast();
  const commissionRates = getCommissionRates();

  // Filter and sort codes
  const filteredAndSortedCodes = useMemo(() => {
    let result = [...codes];
    console.log("Codes before filtering:", result);

    // Apply search filter
    if (searchTerm) {
      result = filterItems(result, searchTerm, ["code"]);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((code) => code.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig) {
      result = sortItems(result, sortConfig);
    }

    return result;
  }, [codes, searchTerm, statusFilter, sortConfig]);

  const handleSort = (key: keyof ReferralCode) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: toggleSortDirection(current.direction),
        };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: keyof ReferralCode) => {
    if (sortConfig?.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortConfig(null);
  };

  const hasActiveFilters = !!(
    searchTerm ||
    statusFilter !== "all" ||
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

  return (
    <div className="referral-codes-section">
      <div className="section-header">
        <h2 className="section-title">
          My Referral Codes ({filteredAndSortedCodes.length})
        </h2>
        <TableFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
      <div className="table-container">
        <table className="referral-codes-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("code")} className="sortable">
                Referral Code {getSortIcon("code")}
              </th>
              <th onClick={() => handleSort("createdAt")} className="sortable">
                Created {getSortIcon("createdAt")}
              </th>
              <th
                onClick={() => handleSort("referralsCount")}
                className="sortable"
              >
                Referrals {getSortIcon("referralsCount")}
              </th>
              <th
                onClick={() => handleSort("trialConversions")}
                className="sortable"
              >
                Trial Conversions {getSortIcon("trialConversions")}
              </th>
              <th
                onClick={() => handleSort("paidConversions")}
                className="sortable"
              >
                Paid Conversions {getSortIcon("paidConversions")}
              </th>
              <th
                onClick={() => handleSort("conversions")}
                className="sortable"
              >
                Total Conversions {getSortIcon("conversions")}
              </th>
              <th onClick={() => handleSort("earnings")} className="sortable">
                Earnings {getSortIcon("earnings")}
              </th>
              <th onClick={() => handleSort("status")} className="sortable">
                Status {getSortIcon("status")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedCodes.length === 0 ? (
              <tr>
                <td colSpan={9} className="no-results">
                  No referral codes found
                </td>
              </tr>
            ) : (
              filteredAndSortedCodes.map((code) => (
                <tr key={code.id}>
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
                  <td>{code.referralsCount?.toLocaleString() || 0}</td>
                  <td>{code.trialConversions?.toLocaleString() || 0}</td>
                  <td>{code.paidConversions?.toLocaleString() || 0}</td>
                  <td>{code.conversions.toLocaleString()}</td>
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
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-detail-button"
                        onClick={() => setSelectedCodeDetail(code)}
                      >
                        View Details
                      </button>
                      {/* <button
                        className="view-users-button"
                        onClick={() => handleViewUsers(code.code)}
                        disabled={loadingUsers}
                      >
                        {loadingUsers ? 'Loading...' : 'View Users'} */}
                      {/* </button> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedCodeDetail && (
        <ReferralCodeDetailView
          referralCode={selectedCodeDetail}
          commissionRates={commissionRates}
          onClose={() => setSelectedCodeDetail(null)}
        />
      )}

      {selectedCode && !selectedCodeDetail && (
        <UserListModal
          referralCode={selectedCode}
          users={users}
          onClose={() => {
            setSelectedCode(null);
            setUsers([]);
          }}
        />
      )}
    </div>
  );
}
