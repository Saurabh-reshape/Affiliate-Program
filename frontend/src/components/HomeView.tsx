import StatsCard from "./StatsCard";
import ReferralCodesTable from "./ReferralCodesTable";
import PerformanceCharts from "./PerformanceCharts";
import HomeSkeleton from "./HomeSkeleton";
import AnalyticsSkeleton from "./AnalyticsSkeleton";
import { formatCurrency } from "../config/commission";
import type { ReferralCode, DashboardStats, TimeSeriesData } from "../types";
import type { CommissionRule } from "../types/commission";

interface HomeViewProps {
  stats: DashboardStats;
  referralCodes: ReferralCode[];
  loadingCodes?: boolean;
  timeSeriesData: TimeSeriesData[];
  defaultStartDate?: string;
  loadingHistory?: boolean;
}

/**
 * Format event type for display (e.g., "free_trial" -> "Free Trial", "3_meals_logged" -> "3 Meals Logged")
 * This is a fallback when display_name is not available
 */
function formatEventType(eventType: string): string {
  return eventType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build a lookup map of event -> display_name from all referral codes
 */
function buildEventDisplayNameMap(
  referralCodes: ReferralCode[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const code of referralCodes) {
    for (const config of code.commissionConfig || []) {
      if (config.display_name && !map.has(config.event)) {
        map.set(config.event, config.display_name);
      }
    }
  }
  return map;
}

/**
 * Build dynamic conversion subtitle from eventStats
 * Shows count of each event type
 */
function buildConversionSubtitle(
  stats: DashboardStats,
  displayNameMap: Map<string, string>
): string {
  const parts: string[] = [];

  // Add all event stats
  if (stats.eventStats && Object.keys(stats.eventStats).length > 0) {
    Object.entries(stats.eventStats).forEach(([eventType, count]) => {
      // Use display name from map if available, otherwise format the event type
      const displayName =
        displayNameMap.get(eventType) || formatEventType(eventType);
      const lowerDisplayName = displayName.toLowerCase();

      // If name starts with a number, wrap in parens to separate from the count
      // e.g. "1 3 meals logged" -> "1 (3 meals logged)"
      if (/^\d/.test(lowerDisplayName)) {
        parts.push(`${count.toLocaleString()} (${lowerDisplayName})`);
      } else {
        parts.push(`${count.toLocaleString()} ${lowerDisplayName}`);
      }
    });
  }

  return parts.length > 0 ? parts.join(" · ") : "No conversions yet";
}

/**
 * Build dynamic earnings subtitle from breakdown
 */
function buildEarningsSubtitle(
  stats: DashboardStats,
  displayNameMap: Map<string, string>
): string {
  const { breakdown, currency } = stats.totalEarnings;
  const parts: string[] = [];

  // Add each breakdown item
  Object.entries(breakdown).forEach(([eventType, amount]) => {
    if (amount > 0) {
      // Use display name from map if available, otherwise format the event type
      const displayName =
        displayNameMap.get(eventType) || formatEventType(eventType);
      parts.push(
        `${formatCurrency(amount, currency)} from ${displayName.toLowerCase()}`
      );
    }
  });

  return parts.length > 0 ? parts.join(" · ") : "No earnings yet";
}

export default function HomeView({
  stats,
  referralCodes,
  loadingCodes = false,
  timeSeriesData,
  defaultStartDate,
  loadingHistory = false,
}: HomeViewProps) {
  // Build display name map from all referral codes
  const displayNameMap = buildEventDisplayNameMap(referralCodes);

  // Aggregate commission rules for the consolidated chart
  // This enables the "Earnings" view mode. If rates vary by code, this uses the first found rate.
  const aggregatedCommissionRules: CommissionRule[] = [];
  const seenRuleEvents = new Set<string>();

  referralCodes.forEach((code) => {
    code.commissionConfig?.forEach((rule) => {
      if (!seenRuleEvents.has(rule.event)) {
        seenRuleEvents.add(rule.event);
        aggregatedCommissionRules.push(rule);
      }
    });
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {loadingCodes ? (
        <HomeSkeleton />
      ) : (
        <>
          <div className="stats-grid">
            <StatsCard
              title="Total Referral Codes"
              value={stats.totalReferralCodes}
              subtitle={`${stats.inactiveReferralCodes} inactive · ${stats.activeReferralCodes} active · ${stats.exhaustedReferralCodes} exhausted`}
            />

            <StatsCard
              title="Total Conversions"
              value={Object.values(stats.eventStats || {})
                .reduce((sum, count) => sum + count, 0)
                .toLocaleString()}
              subtitle={buildConversionSubtitle(stats, displayNameMap)}
            />
            <StatsCard
              title="Total Earnings"
              value={formatCurrency(
                stats.totalEarnings.total,
                stats.totalEarnings.currency
              )}
              subtitle={buildEarningsSubtitle(stats, displayNameMap)}
            />
          </div>
        </>
      )}

      {/* Performance Charts */}
      {loadingHistory ? (
        <AnalyticsSkeleton />
      ) : (
        <PerformanceCharts
          timeSeriesData={timeSeriesData}
          defaultStartDate={defaultStartDate}
          eventDisplayNames={displayNameMap}
          commissionRules={aggregatedCommissionRules}
        />
      )}

      {/* Referral Codes Table */}
      {!loadingCodes && <ReferralCodesTable codes={referralCodes} />}
    </div>
  );
}
