import PerformanceCharts from "./PerformanceCharts";
import AnalyticsSkeleton from "./AnalyticsSkeleton";
import type { TimeSeriesData } from "../types";

interface AnalyticsViewProps {
  timeSeriesData: TimeSeriesData[];
  defaultStartDate?: string;
  loading?: boolean;
  rawPurchaseHistoryResponse?: any;
}

export default function AnalyticsView({
  timeSeriesData,
  defaultStartDate,
  // rawPurchaseHistoryResponse,
  loading = false,
}: AnalyticsViewProps) {
  if (loading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Performance Analytics
        </h2>
      </div>
      <PerformanceCharts
        timeSeriesData={timeSeriesData}
        defaultStartDate={defaultStartDate}
      />

      {/* Debug Section */}
      {/* {rawPurchaseHistoryResponse && (
        <div className="mt-8 border-t border-gray-200 pt-8 no-print">
          <details className="group">
            <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700 list-none flex items-center gap-2">
              <span className="transform group-open:rotate-90 transition-transform text-xs">
                ▶
              </span>
              Debug: Raw API Response (/get-affiliate-purchase-history)
            </summary>
            <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs font-mono shadow-inner max-h-[500px] border border-gray-700">
              {JSON.stringify(rawPurchaseHistoryResponse, null, 2)}
            </pre>
          </details>
        </div>
      )} */}
    </div>
  );
}
