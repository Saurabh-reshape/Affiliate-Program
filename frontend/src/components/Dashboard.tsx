import type {
  User,
  ReferralCode,
  DashboardStats,
  TimeSeriesData,
} from "../types";
import Header from "./Header";
import HomeView from "./HomeView";
import ErrorMessage from "./ErrorMessage";
import { getEarliestStartDate } from "../utils/transformers";

interface DashboardProps {
  user: User;
  referralCodes: ReferralCode[];
  stats: DashboardStats;
  timeSeriesData: TimeSeriesData[];
  loadingCodes?: boolean;
  loadingHistory?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
  rawReferralCodesResponse?: any;
  rawPurchaseHistoryResponse?: any;
}

export default function Dashboard({
  user,
  referralCodes,
  stats,
  timeSeriesData,
  loadingCodes = false,
  loadingHistory = false,
  error = null,
  onRetry,
  onLogout,
}: DashboardProps) {
  const earliestStartDate = getEarliestStartDate(referralCodes);
  const defaultChartStart =
    earliestStartDate ||
    (user.createdAt ? user.createdAt.split("T")[0] : undefined);

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <HomeView
              stats={stats}
              referralCodes={referralCodes}
              loadingCodes={loadingCodes}
              timeSeriesData={timeSeriesData}
              defaultStartDate={defaultChartStart}
              loadingHistory={loadingHistory}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
