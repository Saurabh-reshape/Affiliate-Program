// Generic Skeleton Component
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[rgba(255,255,255,0.08)] rounded ${className}`}
    />
  );
}
