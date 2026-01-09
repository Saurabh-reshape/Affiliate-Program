import PerformanceCharts from "./PerformanceCharts";
import AnalyticsSkeleton from "./AnalyticsSkeleton";
import type { TimeSeriesData } from "../types";

interface AnalyticsViewProps {
  timeSeriesData: TimeSeriesData[];
  defaultStartDate?: string;
  loading?: boolean;
}

export default function AnalyticsView({
  timeSeriesData,
  defaultStartDate,
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
    </div>
  );
}
