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
import AnalyticsView from "./AnalyticsView";
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
  rawReferralCodesResponse,
  rawPurchaseHistoryResponse,
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
                element={
                  <AnalyticsView
                    timeSeriesData={timeSeriesData}
                    defaultStartDate={defaultChartStart}
                    loading={loadingHistory}
                    rawPurchaseHistoryResponse={rawPurchaseHistoryResponse}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Debug Section */}
            {rawReferralCodesResponse && (
              <div className="mt-8 border-t border-gray-200 pt-8 no-print">
                <details className="group">
                  <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 list-none flex items-center gap-2">
                    <span className="transform group-open:rotate-90 transition-transform text-xs">
                      ▶
                    </span>
                    Debug: Raw API Response (/get-affiliate-referral-codes)
                  </summary>
                  <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs font-mono shadow-inner max-h-[500px] border border-gray-700">
                    {JSON.stringify(rawReferralCodesResponse, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
