import Skeleton from "./Skeleton";

export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Chart Canvas */}
      <div className="charts-section">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-1/3" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    </div>
  );
}
