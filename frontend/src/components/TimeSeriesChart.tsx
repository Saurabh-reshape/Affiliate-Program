import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import DateRangeSelector from "./DateRangeSelector";

type PresetOption = "last-30" | "all-time" | "custom";

export interface TimeSeriesChartConfig {
  title?: string;
  defaultStartDate?: string; // If not provided, will use date range from data
  defaultEndDate?: string; // If not provided, will use current date
  showDateRangeSelector?: boolean;
  height?: number;
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
}

interface TimeSeriesChartProps {
  data: any[];
  config: TimeSeriesChartConfig;
}

export default function TimeSeriesChart({
  data,
  config,
}: TimeSeriesChartProps) {
  const todayIso = new Date().toISOString().split("T")[0];

  const getAllTimeStartDate = () => {
    if (config.defaultStartDate) {
      return config.defaultStartDate;
    }
    if (data.length > 0) {
      return data[0].date;
    }
    return null;
  };

  const getLast30StartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  const getDefaultStartDate = () => {
    const allTimeStart = getAllTimeStartDate();
    if (config.defaultStartDate) return config.defaultStartDate;
    if (allTimeStart) return allTimeStart;
    return getLast30StartDate();
  };

  const getDefaultEndDate = () => {
    if (config.defaultEndDate) {
      return config.defaultEndDate;
    }
    return todayIso;
  };

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [preset, setPreset] = useState<PresetOption>(() => {
    const last30Start = getLast30StartDate();
    const allTimeStart = getAllTimeStartDate();
    const initialStart = getDefaultStartDate();

    if (
      allTimeStart &&
      initialStart === allTimeStart &&
      initialStart !== last30Start
    ) {
      return "all-time";
    }
    if (initialStart === last30Start) {
      return "last-30";
    }
    return "custom";
  });

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, startDate, endDate]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Prepare data for charts
  const chartData = filteredData.map((item) => ({
    ...item,
    dateFormatted: formatDate(item.date),
  }));

  const integerTicks = useMemo(() => {
    const maxValue = chartData.reduce((max, row) => {
      const rowMax = config.lines.reduce((lineMax, line) => {
        const value = row[line.dataKey];
        return typeof value === "number" && Number.isFinite(value)
          ? Math.max(lineMax, value)
          : lineMax;
      }, 0);
      return Math.max(max, rowMax);
    }, 0);

    const roundedMax = Math.max(0, Math.ceil(maxValue));
    if (roundedMax <= 1) return [0, 1];

    let step = 1;
    if (roundedMax > 10 && roundedMax <= 50) step = 5;
    else if (roundedMax > 50 && roundedMax <= 100) step = 10;
    else if (roundedMax > 100) step = Math.ceil(roundedMax / 10);

    const ticks: number[] = [];
    for (let v = 0; v <= roundedMax; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] !== roundedMax) ticks.push(roundedMax);
    return ticks;
  }, [chartData, config.lines]);

  const applyPreset = (nextPreset: PresetOption) => {
    if (nextPreset === "last-30") {
      setStartDate(getLast30StartDate());
      setEndDate(todayIso);
    } else if (nextPreset === "all-time") {
      const allTimeStart = getAllTimeStartDate() ?? getLast30StartDate();
      setStartDate(allTimeStart);
      setEndDate(todayIso);
    }
    setPreset(nextPreset);
  };

  const handleReset = () => {
    applyPreset("last-30");
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setPreset("custom");
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setPreset("custom");
  };

  const height = config.height || 400;
  const showDateRangeSelector = config.showDateRangeSelector !== false; // Default to true
  const resetStartDate =
    preset === "all-time"
      ? getAllTimeStartDate() ?? getLast30StartDate()
      : getLast30StartDate();
  const resetEndDate = todayIso;

  return (
    <div className="chart-card">
      {config.title && (
        <div className="chart-header">
          <h3 className="chart-title">{config.title}</h3>
          {showDateRangeSelector && (
            <div className="date-range-selector">
              <select
                className="date-preset-select"
                value={preset}
                onChange={(e) => {
                  const value = e.target.value as PresetOption;
                  if (value === "custom") {
                    setPreset("custom");
                  } else {
                    applyPreset(value);
                  }
                }}
              >
                <option value="last-30">Last 30 days</option>
                <option value="all-time">All time</option>
                <option value="custom">Custom</option>
              </select>
              {preset === "custom" ? (
                <DateRangeSelector
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={handleStartDateChange}
                  onEndDateChange={handleEndDateChange}
                  onReset={handleReset}
                  resetStartDate={resetStartDate}
                  resetEndDate={resetEndDate}
                  resetLabel="Reset to last 30 days"
                  showResetButton
                />
              ) : (
                <div className="date-range-summary">
                  <span className="date-range-chip">
                    {startDate} → {endDate}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {!config.title && showDateRangeSelector && (
        <div className="chart-header">
          <div className="date-range-selector">
            <select
              className="date-preset-select"
              value={preset}
              onChange={(e) => {
                const value = e.target.value as PresetOption;
                if (value === "custom") {
                  setPreset("custom");
                } else {
                  applyPreset(value);
                }
              }}
            >
              <option value="last-30">Last 30 days</option>
              <option value="all-time">All time</option>
              <option value="custom">Custom</option>
            </select>
            {preset === "custom" ? (
              <DateRangeSelector
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onReset={handleReset}
                resetStartDate={resetStartDate}
                resetEndDate={resetEndDate}
                resetLabel="Reset to last 30 days"
                showResetButton
              />
            ) : (
              <div className="date-range-summary">
                <span className="date-range-chip">
                  {startDate} → {endDate}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            ticks={integerTicks}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px var(--shadow-primary)",
              color: "var(--text-primary)",
            }}
            labelStyle={{
              color: "var(--text-primary)",
              fontWeight: "600",
              marginBottom: "4px",
            }}
          />
          <Legend />
          {config.lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              name={line.name}
              connectNulls
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
