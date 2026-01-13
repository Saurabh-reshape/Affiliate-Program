import type { TimeSeriesData } from "../types";
import TimeSeriesChart, { type TimeSeriesChartConfig } from "./TimeSeriesChart";

interface PerformanceChartsProps {
  timeSeriesData: TimeSeriesData[];
  title?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  showDateRangeSelector?: boolean;
  eventDisplayNames?: Map<string, string>;
}

const COLORS = [
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#ef4444", // Red
];

export default function PerformanceCharts({
  timeSeriesData,
  // title = "Performance Overview",
  defaultStartDate,
  defaultEndDate,
  showDateRangeSelector = true,
  eventDisplayNames,
}: PerformanceChartsProps) {
  // Collect all unique event keys from all data points
  const uniqueEvents = new Set<string>();

  // First pass: collect event keys
  timeSeriesData.forEach((d) => {
    if (d.eventCounts) {
      Object.keys(d.eventCounts).forEach((key) => uniqueEvents.add(key));
    }
  });

  // Ensure every data point has all event keys (default to 0)
  const allEvents = Array.from(uniqueEvents);
  const flatData = timeSeriesData.map((d) => {
    const flatNode: any = { date: d.date };
    // initialize all events to 0 so lines render continuously
    allEvents.forEach((key) => {
      flatNode[key] = 0;
    });
    // override with actual counts for this date
    if (d.eventCounts) {
      Object.entries(d.eventCounts).forEach(([key, count]) => {
        flatNode[key] = typeof count === "number" ? count : Number(count) || 0;
      });
    }
    return flatNode;
  });

  // Build chart lines dynamically from event types found in data
  const lines: Array<{ dataKey: string; name: string; color: string }> = [];

  // Define a preferred order: signup first, then others alphabetically
  const orderedEvents = Array.from(uniqueEvents).sort((a, b) => {
    if (a === "signup") return -1;
    if (b === "signup") return 1;
    return a.localeCompare(b);
  });

  // Create lines with consistent colors
  orderedEvents.forEach((event, index) => {
    // Parse name for display (e.g. free_trial -> Free Trial)
    const displayName =
      eventDisplayNames?.get(event) ||
      event
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    // Use blue for signup (primary), then cycle through other colors
    const color =
      event === "signup" ? "#3b82f6" : COLORS[index % COLORS.length];

    lines.push({
      dataKey: event,
      name: displayName,
      color,
    });
  });

  const chartConfig: TimeSeriesChartConfig = {
    // title: "Events Over Time",
    defaultStartDate,
    defaultEndDate,
    showDateRangeSelector,
    height: 400,
    lines,
  };

  return (
    <div className="charts-section">
      {/* <h2 className="section-title">{title}</h2> */}
      <TimeSeriesChart data={flatData} config={chartConfig} />
    </div>
  );
}
