import type { TimeSeriesData } from "../types";
import TimeSeriesChart, { type TimeSeriesChartConfig } from "./TimeSeriesChart";

interface PerformanceChartsProps {
  timeSeriesData: TimeSeriesData[];
  title?: string;
  defaultStartDate?: string;
  defaultEndDate?: string;
  showDateRangeSelector?: boolean;
}

export default function PerformanceCharts({
  timeSeriesData,
  title = "Performance Overview",
  defaultStartDate,
  defaultEndDate,
  showDateRangeSelector = true,
}: PerformanceChartsProps) {
  const chartConfig: TimeSeriesChartConfig = {
    title: "Conversions Over Time",
    defaultStartDate,
    defaultEndDate,
    showDateRangeSelector,
    height: 400,
    lines: [
      {
        dataKey: "conversions",
        name: "Total Conversions",
        color: "#6366f1",
      },
      {
        dataKey: "trialConversions",
        name: "Free Trial",
        color: "#10b981",
      },
      {
        dataKey: "paidConversions",
        name: "Paid",
        color: "#f59e0b",
      },
    ],
  };

  return (
    <div className="charts-section">
      <h2 className="section-title">{title}</h2>
      <TimeSeriesChart data={timeSeriesData} config={chartConfig} />
    </div>
  );
}
