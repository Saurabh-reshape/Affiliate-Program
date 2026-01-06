import { useState, useEffect, useMemo } from "react";
import { apiService } from "../services/api";
import { useFilters } from "../hooks/useFilters";
import { formatCurrency } from "../config/commission";
import { formatDateTime } from "../utils/dateUtils";
import type { CommissionRate } from "../types/commission";
import type { PurchaseEvent } from "../types/purchaseHistory";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import PerformanceCharts from "./PerformanceCharts";
import {
  generateTimeSeriesWithDateRange,
  getEarliestEventDate,
} from "../utils/timeSeries";

interface UserDetailViewProps {
  userId: string;
  userName?: string;
  userEmail?: string;
  referralCode: string;
  commissionRates: CommissionRate;
  onClose: () => void;
}

export default function UserDetailView({
  userId,
  userName,
  userEmail,
  referralCode,
  commissionRates,
  onClose,
}: UserDetailViewProps) {
  const [events, setEvents] = useState<PurchaseEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const {
    filteredItems: filteredEvents,
    searchTerm,
    setSearchTerm,
    sortConfig,
    handleSort,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilters,
    hasActiveFilters,
  } = useFilters<PurchaseEvent>(events, {
    searchKeys: ["product_id", "transaction_id", "country_code"],
    dateKey: "purchased_at_ms",
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.getReferralDetails(referralCode);
        if (response.success && response.data) {
          const userData = response.data.find(
            (user: any) => user.userId === userId
          );

          if (userData && userData.events) {
            const purchaseEvents = userData.events.filter(
              (e: any) => e && typeof e === "object"
            ) as PurchaseEvent[];
            setEvents(purchaseEvents);
          } else {
            setEvents([]);
          }
        } else {
          setError("Failed to fetch user data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching user timeline:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, referralCode]);

  // Apply event type filter
  const finalFilteredEvents =
    eventTypeFilter === "all"
      ? filteredEvents
      : filteredEvents.filter((e) => e.type === eventTypeFilter);

  const getSortIcon = (key: keyof PurchaseEvent) => {
    if (sortConfig?.key !== key) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const getEventTypeLabel = (event: PurchaseEvent) => {
    switch (event.type) {
      case "INITIAL_PURCHASE":
        return event.period_type === "TRIAL"
          ? "Trial Started"
          : "Paid Subscription";
      case "RENEWAL":
        return "Subscription Renewed";
      case "CANCELLATION":
        return "Subscription Cancelled";
      case "SUBSCRIPTION_PAUSED":
        return "Subscription Paused";
      default:
        return event.type;
    }
  };

  const getEventIcon = (event: PurchaseEvent) => {
    switch (event.type) {
      case "INITIAL_PURCHASE":
        return event.period_type === "TRIAL" ? "🆓" : "💳";
      case "RENEWAL":
        return "🔄";
      case "CANCELLATION":
        return "❌";
      case "SUBSCRIPTION_PAUSED":
        return "⏸️";
      default:
        return "📅";
    }
  };

  // Calculate user earnings
  const userEarnings = events.reduce(
    (acc, event) => {
      if (event.type === "INITIAL_PURCHASE") {
        if (event.period_type === "TRIAL") {
          acc.fromTrials += commissionRates.perTrialConversion;
        } else if (event.period_type === "NORMAL") {
          acc.fromPaid += commissionRates.perPaidConversion;
        }
      }
      return acc;
    },
    { fromTrials: 0, fromPaid: 0 }
  );
  const totalEarnings = userEarnings.fromTrials + userEarnings.fromPaid;

  // Generate time series data for this user
  const timeSeriesData = useMemo(() => {
    const initialPurchases = events.filter(
      (e) => e.type === "INITIAL_PURCHASE"
    );
    const earliestDate = getEarliestEventDate(initialPurchases);

    if (!earliestDate) {
      return [];
    }

    return generateTimeSeriesWithDateRange(
      initialPurchases,
      earliestDate,
      new Date()
    );
  }, [events]);

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

  return (
    <div className="detail-view-overlay" onClick={onClose}>
      <div className="detail-view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="detail-view-header">
          <div>
            <h2>User Timeline</h2>
            <div className="user-timeline-user-info">
              <p>
                <strong>Name:</strong> {userName || "N/A"}
              </p>
              <p>
                <strong>Email:</strong> {userEmail || "N/A"}
              </p>
              <p>
                <strong>User ID:</strong> {userId}
              </p>
              <p>
                <strong>Referral Code:</strong> {referralCode}
              </p>
              <p className="earnings-info">
                <strong>Earnings Generated:</strong>{" "}
                <span className="earnings-value">
                  {formatCurrency(totalEarnings, commissionRates.currency)}
                </span>{" "}
                (
                {formatCurrency(
                  userEarnings.fromTrials,
                  commissionRates.currency
                )}{" "}
                from trials,{" "}
                {formatCurrency(
                  userEarnings.fromPaid,
                  commissionRates.currency
                )}{" "}
                from paid)
              </p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="detail-view-content">
          {/* Time series chart for user's earnings */}
          {timeSeriesData.length > 0 && (
            <div className="detail-chart-section">
              <PerformanceCharts
                timeSeriesData={timeSeriesData}
                title={`Earnings Timeline for ${userName || userId}`}
                defaultStartDate={
                  getEarliestEventDate(
                    events.filter((e) => e.type === "INITIAL_PURCHASE")
                  ) || undefined
                }
              />
            </div>
          )}

          {/* Filters */}
          <div className="timeline-filters">
            <div className="filter-group">
              <label>Search:</label>
              <input
                type="text"
                placeholder="Search by product, transaction ID, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <label>Event Type:</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Events</option>
                <option value="INITIAL_PURCHASE">Initial Purchase</option>
                <option value="RENEWAL">Renewal</option>
                <option value="CANCELLATION">Cancellation</option>
                <option value="SUBSCRIPTION_PAUSED">Paused</option>
              </select>
            </div>
            <div className="filter-group">
              <label>From:</label>
              <input
                type="date"
                value={startDate || ""}
                onChange={(e) => setStartDate(e.target.value || null)}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label>To:</label>
              <input
                type="date"
                value={endDate || ""}
                onChange={(e) => setEndDate(e.target.value || null)}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label>Sort:</label>
              <button
                onClick={() => handleSort("purchased_at_ms")}
                className="sort-button"
              >
                Date {getSortIcon("purchased_at_ms")}
              </button>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="clear-filters-button">
                Clear All
              </button>
            )}
          </div>

          {/* Timeline */}
          <div className="timeline-section">
            {finalFilteredEvents.length === 0 ? (
              <div className="no-events">
                <p>No events found matching your filters.</p>
              </div>
            ) : (
              <div className="timeline">
                {finalFilteredEvents.map((event, index) => (
                  <div
                    key={`${event.id || index}-${event.purchased_at_ms}`}
                    className="timeline-item"
                  >
                    <div className="timeline-marker">
                      <span className="timeline-icon">
                        {getEventIcon(event)}
                      </span>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h3>{getEventTypeLabel(event)}</h3>
                        <span className="timeline-date">
                          {formatDateTime(event.purchased_at_ms)}
                        </span>
                      </div>
                      <div className="timeline-details">
                        {event.type === "INITIAL_PURCHASE" && (
                          <>
                            <p>
                              <strong>Product:</strong> {event.product_id}
                            </p>
                            <p>
                              <strong>Type:</strong> {event.period_type}
                            </p>
                            {event.price !== undefined && event.price > 0 && (
                              <p>
                                <strong>Price:</strong>{" "}
                                {formatCurrency(event.price, event.currency)}
                              </p>
                            )}
                            <p>
                              <strong>Store:</strong> {event.store}
                            </p>
                            <p>
                              <strong>Country:</strong> {event.country_code}
                            </p>
                            {event.period_type === "TRIAL" && (
                              <p className="earnings-note">
                                <strong>Earnings:</strong>{" "}
                                {formatCurrency(
                                  commissionRates.perTrialConversion,
                                  commissionRates.currency
                                )}
                              </p>
                            )}
                            {event.period_type === "NORMAL" && (
                              <p className="earnings-note">
                                <strong>Earnings:</strong>{" "}
                                {formatCurrency(
                                  commissionRates.perPaidConversion,
                                  commissionRates.currency
                                )}
                              </p>
                            )}
                          </>
                        )}
                        {event.type === "RENEWAL" && (
                          <>
                            <p>
                              <strong>Product:</strong> {event.product_id}
                            </p>
                            {event.price !== undefined && (
                              <p>
                                <strong>Price:</strong>{" "}
                                {formatCurrency(event.price, event.currency)}
                              </p>
                            )}
                          </>
                        )}
                        {event.transaction_id && (
                          <p>
                            <strong>Transaction ID:</strong>{" "}
                            <code>{event.transaction_id}</code>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
