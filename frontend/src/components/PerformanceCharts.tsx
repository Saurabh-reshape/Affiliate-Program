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
  // title = "Performance Overview",
  defaultStartDate,
  defaultEndDate,
  showDateRangeSelector = true,
}: PerformanceChartsProps) {
  const chartConfig: TimeSeriesChartConfig = {
    // title: "Signups, Trials & Purchases Over Time",
    defaultStartDate,
    defaultEndDate,
    showDateRangeSelector,
    height: 400,
    lines: [
      {
        dataKey: "signupConversions",
        name: "Signups",
        color: "#3b82f6",
      },
      {
        dataKey: "trialConversions",
        name: "Free Trial",
        color: "#10b981",
      },
      {
        dataKey: "paidConversions",
        name: "Purchases",
        color: "#f59e0b",
      },
    ],
  };

  return (
    <div className="charts-section">
      {/* <h2 className="section-title">{title}</h2> */}
      <TimeSeriesChart data={timeSeriesData} config={chartConfig} />
    </div>
  );
}
