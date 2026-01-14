import { useState, useRef, useEffect } from "react";
import {
  RotateCcw,
  BarChart3,
  DollarSign,
  Filter,
  ChevronDown,
  Check,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { TimeSeriesData } from "../types";
import type { CommissionRule } from "../types/commission";
import TimeSeriesChart, { type TimeSeriesChartConfig } from "./TimeSeriesChart";

type DatePreset = "last-30" | "last-90" | "all-time" | "custom";
interface PerformanceChartsProps {
  timeSeriesData: TimeSeriesData[];
  title?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  showDateRangeSelector?: boolean;
  eventDisplayNames?: Map<string, string>;
  commissionRules?: CommissionRule[];
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
  commissionRules,
}: PerformanceChartsProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string> | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"count" | "earnings">("count");
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  // Date State
  const todayIso = new Date().toISOString().split("T")[0];
  const last30DaysIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [datePreset, setDatePreset] = useState<DatePreset>("last-30");
  const [startDate, setStartDate] = useState<string>(
    defaultStartDate || last30DaysIso
  );
  const [endDate, setEndDate] = useState<string>(defaultEndDate || todayIso);

  const metricMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        metricMenuRef.current &&
        !metricMenuRef.current.contains(event.target as Node)
      ) {
        setIsMetricMenuOpen(false);
      }
      if (
        dateMenuRef.current &&
        !dateMenuRef.current.contains(event.target as Node)
      ) {
        setIsDateMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Preset Changes
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const end = new Date().toISOString().split("T")[0];
    let start = "";

    if (preset === "last-30") {
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    } else if (preset === "last-90") {
      start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    } else if (preset === "all-time") {
      // Find earliest date in data
      if (timeSeriesData.length > 0) {
        start = timeSeriesData[0].date;
      } else {
        start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      }
    }

    if (preset !== "custom") {
      setStartDate(start);
      setEndDate(end);
      setIsDateMenuOpen(false);
    }
  };

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

  const getRate = (event: string) => {
    if (!commissionRules) return 0;
    const rule = commissionRules.find((r) => r.event === event);
    return rule ? rule.rate : 0;
  };

  // Filter Data by Date FIRST
  const filteredTimeData = timeSeriesData.filter(
    (d) => d.date >= startDate && d.date <= endDate
  );

  const flatData = filteredTimeData.map((d) => {
    const flatNode: any = { date: d.date };
    let totalConversions = 0;
    let totalEarnings = 0;

    // initialize all events to 0 so lines render continuously
    allEvents.forEach((key) => {
      flatNode[key] = 0;
    });

    // override with actual counts for this date
    if (d.eventCounts) {
      Object.entries(d.eventCounts).forEach(([key, count]) => {
        const val = typeof count === "number" ? count : Number(count) || 0;
        const earnings = val * getRate(key);

        if (viewMode === "count") {
          flatNode[key] = val;
        } else {
          flatNode[key] = earnings;
        }

        // Calculate totals (exclude link_click)
        if (key !== "link_click") {
          totalConversions += val;
          totalEarnings += earnings;
        }
      });
    }

    // Add total metric based on viewMode
    if (viewMode === "count") {
      flatNode["total_metric"] = totalConversions;
    } else {
      flatNode["total_metric"] = totalEarnings;
    }

    return flatNode;
  });

  // Build chart lines dynamically from event types found in data
  const lines: Array<{ dataKey: string; name: string; color: string }> = [];

  // Add "Total Conversions" line first
  lines.push({
    dataKey: "total_metric",
    name: viewMode === "count" ? "Total Conversions" : "Total Earnings",
    color: "#059669", // Emerald-600
  });

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

  // Filter lines based on selected state
  const metricsToShow = selectedMetrics ?? new Set(lines.map((l) => l.dataKey));

  const toggleMetric = (key: string) => {
    const next = new Set(metricsToShow);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedMetrics(next);
  };

  const resetFilters = () => {
    setSelectedMetrics(null);
    setViewMode("count");
    handlePresetChange("last-30");
  };

  const chartConfig: TimeSeriesChartConfig = {
    // title: "Events Over Time",
    defaultStartDate,
    defaultEndDate,
    showDateRangeSelector: false,
    height: 400,
    yAxisLabel: viewMode === "count" ? "Count" : "Amount ($)",
    lines: lines.filter((l) => metricsToShow.has(l.dataKey)),
  };

  // Helper for date display
  const getDateLabel = () => {
    if (datePreset === "last-30") return "Last 30 Days";
    if (datePreset === "last-90") return "Last 90 Days";
    if (datePreset === "all-time") return "All Time";
    return "Custom Range";
  };

  return (
    <div className="charts-section bg-bg-secondary rounded-lg border border-border-primary p-4">
      {/* Controls Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 pb-4 border-b border-border-primary">
        {/* Left Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggles */}
          <div className="flex bg-bg-tertiary p-1 rounded-lg border border-border-primary">
            <button
              onClick={() => setViewMode("count")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "count"
                  ? "bg-bg-secondary text-brand shadow-sm border border-border-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Conversions
            </button>
            <button
              onClick={() => setViewMode("earnings")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "earnings"
                  ? "bg-bg-secondary text-brand shadow-sm border border-border-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Earnings
            </button>
          </div>

          <div className="h-6 w-px bg-border-primary mx-1 hidden sm:block"></div>

          {/* Date Filter Dropdown */}
          {/* <div className="relative" ref={dateMenuRef}>
            <button
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                isDateMenuOpen
                  ? "bg-bg-tertiary text-brand border-brand"
                  : "bg-bg-secondary text-text-primary border-border-primary hover:bg-bg-tertiary hover:border-text-secondary/30"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{getDateLabel()}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isDateMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDateMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-gray-900 rounded-lg shadow-secondary border border-border-primary z-20 overflow-hidden">
                <div className="p-2 border-b border-border-primary bg-bg-tertiary">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Date Range
                  </span>
                </div>
                <div className="p-2 grid grid-cols-1 gap-1">
                  {["last-30", "last-90", "all-time", "custom"].map(
                    (preset) => (
                      <button
                        key={preset}
                        onClick={() => handlePresetChange(preset as DatePreset)}
                        className={`text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                          datePreset === preset
                            ? "bg-bg-tertiary text-brand"
                            : "text-text-primary hover:bg-bg-tertiary"
                        }`}
                      >
                        {preset === "last-30" && "Last 30 Days"}
                        {preset === "last-90" && "Last 90 Days"}
                        {preset === "all-time" && "All Time"}
                        {preset === "custom" && "Custom Range"}
                        {datePreset === preset && <Check className="w-4 h-4" />}
                      </button>
                    )
                  )}
                </div>

                {/* Custom Date Inputs */}
          {/* {datePreset === "custom" && (
                  <div className="p-3 border-t border-border-primary bg-bg-tertiary space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-text-secondary font-medium ml-1">
                          Start
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full text-sm bg-bg-secondary text-text-primary border border-border-primary rounded-md focus:border-brand focus:ring-1 focus:ring-brand outline-none px-2 py-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-text-secondary font-medium ml-1">
                          End
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full text-sm bg-bg-secondary text-text-primary border border-border-primary rounded-md focus:border-brand focus:ring-1 focus:ring-brand outline-none px-2 py-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div> */}

          {/* Metric Filter Dropdown */}
          <div className="relative" ref={metricMenuRef}>
            <button
              onClick={() => setIsMetricMenuOpen(!isMetricMenuOpen)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                isMetricMenuOpen || selectedMetrics !== null
                  ? "bg-bg-tertiary text-brand border-brand"
                  : "bg-bg-secondary text-text-primary border-border-primary hover:bg-bg-tertiary hover:border-text-secondary/30"
              }`}
            >
              <Filter className="w-4 h-4" />
              Metrics
              <span className="bg-bg-tertiary text-brand text-xs px-2 rounded-full min-w-[1.5rem] text-center border border-border-primary">
                {`${metricsToShow.size}/${lines.length}`}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isMetricMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isMetricMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-secondary border border-border-primary z-20 overflow-hidden">
                <div className="p-2 border-b border-border-primary bg-bg-tertiary flex justify-between items-center">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Select Metrics
                  </span>
                  {selectedMetrics !== null && (
                    <button
                      onClick={() => setSelectedMetrics(null)}
                      className="text-xs text-brand hover:text-brand-hover font-medium"
                    >
                      Select All
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-1 custom-scrollbar">
                  {lines.map((line) => (
                    <label
                      key={line.dataKey}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-bg-tertiary rounded-md cursor-pointer group transition-colors"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={metricsToShow.has(line.dataKey)}
                          onChange={() => toggleMetric(line.dataKey)}
                          className="peer appearance-none w-4 h-4 border border-border-highlight rounded bg-bg-primary checked:bg-brand checked:border-brand transition-colors"
                        />
                        <Check className="w-3 h-3 text-brand-text absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: line.color }}
                        />
                        <span className="text-sm text-text-primary group-hover:text-white truncate">
                          {line.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Button */}
          {(selectedMetrics !== null || viewMode !== "count") && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md transition-colors ml-auto sm:ml-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* <h2 className="section-title">{title}</h2> */}
      <TimeSeriesChart data={flatData} config={chartConfig} />
    </div>
  );
}
