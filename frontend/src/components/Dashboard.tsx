import type { User, ReferralCode, DashboardStats, TimeSeriesData } from '../types';
import Header from './Header';
import StatsCard from './StatsCard';
import ReferralCodesTable from './ReferralCodesTable';
import PerformanceCharts from './PerformanceCharts';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

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
  onRetry
}: DashboardProps) {
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
              subtitle="Active codes"
              icon="🔗"
            />
            <StatsCard
              title="Total Conversions"
              value={stats.totalConversions.toLocaleString()}
              subtitle="All conversions"
              icon="✅"
            />
            <StatsCard
              title="Trial Conversions"
              value={stats.trialConversions.toLocaleString()}
              subtitle="Trial subscriptions"
              icon="🆓"
            />
            <StatsCard
              title="Paid Conversions"
              value={stats.paidConversions.toLocaleString()}
              subtitle="Paid subscriptions"
              icon="💳"
            />
          </div>

          {/* Charts */}
          <PerformanceCharts timeSeriesData={timeSeriesData} />

          {/* Referral Codes Table */}
          <ReferralCodesTable codes={referralCodes} />
        </div>
      </main>
    </div>
  );
}

