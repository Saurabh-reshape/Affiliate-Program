import StatsCard from "./StatsCard";
import ReferralCodesTable from "./ReferralCodesTable";
import HomeSkeleton from "./HomeSkeleton";
import { formatCurrency } from "../config/commission";
import type { ReferralCode, DashboardStats } from "../types";

interface HomeViewProps {
  stats: DashboardStats;
  referralCodes: ReferralCode[];
  loading?: boolean;
}

export default function HomeView({
  stats,
  referralCodes,
  loading = false,
}: HomeViewProps) {
  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Total Referral Codes"
          value={stats.totalReferralCodes}
          subtitle={`${stats.inactiveReferralCodes} inactive · ${stats.activeReferralCodes} active · ${stats.exhaustedReferralCodes} exhausted`}
        />

        <StatsCard
          title="Total Conversions"
          value={stats.totalConversions.toLocaleString()}
          subtitle={`${stats.signupConversions.toLocaleString()} signups · ${stats.trialConversions.toLocaleString()} trial · ${stats.paidConversions.toLocaleString()} paid`}
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
        />
      </div>

      {/* Referral Codes Table */}
      <ReferralCodesTable codes={referralCodes} />
    </div>
  );
}
