import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useFilters } from "../hooks/useFilters";
import { formatCurrency } from "../config/commission";
import type { ReferralCode } from "../types";
import type { CommissionRate } from "../types/commission";
import UserDetailView from "./UserDetailView";
import PerformanceCharts from "./PerformanceCharts";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { generateTimeSeriesWithDateRange } from "../utils/timeSeries";
import type { PurchaseEvent } from "../types/purchaseHistory";
import type { TimeSeriesData } from "../types";

interface ReferralCodeDetailViewProps {
  referralCode: ReferralCode;
  commissionRates: CommissionRate;
  onClose: () => void;
}

interface User {
  userId: string;
  email: string | null;
  name: string | null;
  subscriptionInfo?: any;
  events?: any[];
}

export default function ReferralCodeDetailView({
  referralCode,
  commissionRates,
  onClose,
}: ReferralCodeDetailViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);

  const {
    filteredItems: filteredUsers,
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort,
    clearFilters,
    hasActiveFilters,
  } = useFilters<User>(users, {
    searchKeys: ["name", "email", "userId"],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getReferralDetails(referralCode.code);
        if (response.success && response.data) {
          setUsers(response.data);

          // Generate time series data for this code from code creation date to now
          const allEvents: PurchaseEvent[] = [];
          response.data.forEach((user: User) => {
            if (user.events && Array.isArray(user.events)) {
              user.events.forEach((event: any) => {
                if (
                  event &&
                  event.type === "INITIAL_PURCHASE" &&
                  event.purchased_at_ms
                ) {
                  allEvents.push(event as PurchaseEvent);
                }
              });
            }
          });

          // Use code creation date as start date, current date as end date
          const startDate = referralCode.createdAt.split("T")[0];
          const timeSeries = generateTimeSeriesWithDateRange(
            allEvents,
            startDate,
            new Date()
          );
          setTimeSeriesData(timeSeries);
        } else {
          setError("Failed to fetch referral code details");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching referral code details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [referralCode.code]);

  const getSortIcon = (key: keyof User) => {
    if (sortConfig?.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  if (selectedUser) {
    return (
      <UserDetailView
        userId={selectedUser.userId}
        userName={selectedUser.name || undefined}
        userEmail={selectedUser.email || undefined}
        referralCode={referralCode.code}
        commissionRates={commissionRates}
        onClose={() => setSelectedUser(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="detail-view-overlay" onClick={onClose}>
        <div className="detail-view-modal" onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-view-overlay" onClick={onClose}>
        <div className="detail-view-modal" onClick={(e) => e.stopPropagation()}>
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  const earnings = referralCode.earnings || {
    fromTrials: 0,
    fromPaid: 0,
    total: 0,
    currency: commissionRates.currency,
  };

  return (
    <div className="detail-view-overlay" onClick={onClose}>
      <div className="detail-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-view-header">
          <div>
            <h2>Referral Code: {referralCode.code}</h2>
            <div className="detail-view-stats">
              <div className="stat-item">
                <span className="stat-label">Total Conversions:</span>
                <span className="stat-value">{referralCode.conversions}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Trial:</span>
                <span className="stat-value">
                  {referralCode.trialConversions || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Paid:</span>
                <span className="stat-value">
                  {referralCode.paidConversions || 0}
                </span>
              </div>
              <div className="stat-item earnings-stat">
                <span className="stat-label">Total Earnings:</span>
                <span className="stat-value earnings">
                  {formatCurrency(earnings.total, earnings.currency)}
                </span>
              </div>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="detail-view-content">
          {/* Chart for this code */}
          <div className="detail-chart-section">
            <PerformanceCharts
              timeSeriesData={timeSeriesData}
              title={`Performance for ${referralCode.code}`}
              defaultStartDate={referralCode.createdAt.split("T")[0]}
            />
          </div>

          {/* Users Section */}
          <div className="detail-users-section">
            <div className="section-header">
              <h3>
                Users ({filteredUsers.length} of {users.length})
              </h3>
              <div className="filter-controls">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="clear-filters-button"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("name")} className="sortable">
                      Name {getSortIcon("name")}
                    </th>
                    <th
                      onClick={() => handleSort("email")}
                      className="sortable"
                    >
                      Email {getSortIcon("email")}
                    </th>
                    <th
                      onClick={() => handleSort("userId")}
                      className="sortable"
                    >
                      User ID {getSortIcon("userId")}
                    </th>
                    <th>Events</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="no-results">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.userId}>
                        <td>{user.name || "N/A"}</td>
                        <td>{user.email || "N/A"}</td>
                        <td>
                          <code className="user-id-code">{user.userId}</code>
                        </td>
                        <td>{user.events?.length || 0}</td>
                        <td>
                          <button
                            className="view-timeline-button"
                            onClick={() => setSelectedUser(user)}
                          >
                            View Timeline
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
