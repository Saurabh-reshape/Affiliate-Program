import type {
  User,
  ReferralCode,
  DashboardStats,
  TimeSeriesData,
} from "../types";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import HomeView from "./HomeView";
// import AnalyticsView from "./AnalyticsView";
import ComingSoon from "./ComingSoon";
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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <HomeView
                    stats={stats}
                    referralCodes={referralCodes}
                    loading={loadingCodes}
                  />
                }
              />
              <Route
                path="/analytics"
                element={<ComingSoon />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
