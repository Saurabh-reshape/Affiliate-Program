import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useFilters } from "../hooks/useFilters";
import { formatCurrency } from "../config/commission";
import type { ReferralCode } from "../types";
import UserDetailView from "./UserDetailView";
import PerformanceCharts from "./PerformanceCharts";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { buildTimeSeriesFromUsers } from "../utils/timeSeries";
import type { TimeSeriesData } from "../types";

interface ReferralCodeDetailViewProps {
  referralCode: ReferralCode;
  onClose: () => void;
}

interface User {
  userId: string;
  email: string | null;
  name: string | null;
  subscriptionInfo?: any;
  referralCreatedAt?: string | null;
  events?: any[];
}

export default function ReferralCodeDetailView({
  referralCode,
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
          // De-dupe by userId (backend can return duplicates if referrals contain repeats)
          const userById = new Map<string, User>();
          (response.data as User[]).forEach((u) => {
            if (!u?.userId) return;
            const incomingEvents = Array.isArray(u.events) ? u.events : [];
            const existing = userById.get(u.userId);
            if (!existing) {
              userById.set(u.userId, {
                ...u,
                events: incomingEvents,
              });
              return;
            }

            userById.set(u.userId, {
              ...existing,
              email: existing.email ?? u.email ?? null,
              name: existing.name ?? u.name ?? null,
              subscriptionInfo: existing.subscriptionInfo ?? u.subscriptionInfo,
              events: [...(existing.events || []), ...incomingEvents],
            });
          });

          const uniqueUsers = Array.from(userById.values());
          setUsers(uniqueUsers);

          // Generate time series data using centralized helper
          // Use code creation date as start date
          const timeSeries = buildTimeSeriesFromUsers(
            uniqueUsers,
            referralCode.createdAt
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
        commissionConfig={referralCode.commissionConfig}
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

  const earningsCurrency =
    referralCode.earnings?.currency ||
    referralCode.commissionConfig?.find((r) => r.currency)?.currency ||
    "USD";

  const earnings = referralCode.earnings || {
    breakdown: {},
    total: 0,
    currency: earningsCurrency,
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
                <span className="stat-label">Signups:</span>
                <span className="stat-value">
                  {referralCode.signupConversions || 0}
                </span>
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
            {/* Commission Rates */}
            {referralCode.commissionConfig &&
              referralCode.commissionConfig.length > 0 && (
                <div className="commission-rates">
                  <span className="rates-label">Commission Rates:</span>
                  <div className="rates-list">
                    {referralCode.commissionConfig.map((rule, index) => (
                      <span key={index} className="rate-badge">
                        {rule.event === "free_trial"
                          ? "Free Trial"
                          : rule.event === "purchase"
                          ? "Purchase"
                          : rule.event === "signup"
                          ? "Signup"
                          : rule.event}
                        : {formatCurrency(rule.rate, rule.currency)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
