import Skeleton from "./Skeleton";

export default function HomeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="stats-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stats-card">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="referral-codes-section">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
