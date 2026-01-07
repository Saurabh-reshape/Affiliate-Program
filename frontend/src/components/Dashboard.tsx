import type {
  User,
  ReferralCode,
  DashboardStats,
  TimeSeriesData,
} from "../types";
import Header from "./Header";
import StatsCard from "./StatsCard";
import ReferralCodesTable from "./ReferralCodesTable";
import PerformanceCharts from "./PerformanceCharts";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import { formatCurrency } from "../config/commission";
import { getEarliestStartDate } from "../utils/transformers";

interface DashboardProps {
  user: User;
  referralCodes: ReferralCode[];
  stats: DashboardStats;
  timeSeriesData: TimeSeriesData[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function Dashboard({
  user,
  referralCodes,
  stats,
  timeSeriesData,
  loading = false,
  error = null,
  onRetry,
}: DashboardProps) {
  const earliestStartDate = getEarliestStartDate(referralCodes);
  const defaultChartStart =
    earliestStartDate ||
    (user.createdAt ? user.createdAt.split("T")[0] : undefined);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  return (
    <div className="dashboard">
      <Header user={user} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatsCard
              title="Total Referral Codes"
              value={stats.totalReferralCodes}
              subtitle={`${stats.inactiveReferralCodes} inactive · ${stats.activeReferralCodes} active · ${stats.exhaustedReferralCodes} exhausted`}
              icon="📋"
            />

            <StatsCard
              title="Total Conversions"
              value={stats.totalConversions.toLocaleString()}
              subtitle={`${stats.signupConversions.toLocaleString()} signups · ${stats.trialConversions.toLocaleString()} trial · ${stats.paidConversions.toLocaleString()} paid`}
              icon="✅"
            />
            <StatsCard
              title="Total Earnings"
              value={formatCurrency(
                stats.totalEarnings.total,
                stats.totalEarnings.currency
              )}
              subtitle={`${formatCurrency(
                stats.totalEarnings.breakdown["signup"] || 0,
                stats.totalEarnings.currency
              )} from signups · ${formatCurrency(
                stats.totalEarnings.breakdown["free_trial"] || 0,
                stats.totalEarnings.currency
              )} from free trials · ${formatCurrency(
                stats.totalEarnings.breakdown["purchase"] || 0,
                stats.totalEarnings.currency
              )} from paid`}
              icon="💰"
            />
          </div>

          {/* Charts */}
          <PerformanceCharts
            timeSeriesData={timeSeriesData}
            defaultStartDate={defaultChartStart}
          />

          {/* Referral Codes Table */}
          <ReferralCodesTable codes={referralCodes} />
        </div>
      </main>
    </div>
  );
}
