import { useMemo, useId } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  // CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface TimeSeriesChartConfig {
  title?: string;
  height?: number;
  yAxisLabel?: string;
  isEarningsMode?: boolean; // If true, format values with $ symbol after number
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
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Prepare data for charts
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      dateFormatted: formatDate(item.date),
    }));
  }, [data]);

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

  const height = config.height || 400;
  const chartId = useId();

  return (
    <div className="chart-card">
      {config.title && (
        <div className="chart-header">
          <h3 className="chart-title">{config.title}</h3>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} id={chartId}>
          {/*<CartesianGrid strokeDasharray="3 3" />*/}
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
            tickFormatter={(value) => {
              if (config.isEarningsMode && typeof value === "number") {
                return `${value.toFixed(0)}$`;
              }
              return value.toString();
            }}
            label={
              config.yAxisLabel
                ? {
                    value: config.yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fill: "var(--text-secondary)",
                      fontSize: 12,
                    },
                  }
                : undefined
            }
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
            formatter={(value: number | undefined) => {
              if (config.isEarningsMode && typeof value === "number") {
                return `${value.toFixed(2)}$`;
              }
              return value;
            }}
          />
          <Legend />
          {config.lines.map((line) => (
            <Line
              key={line.dataKey}
              type="natural"
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
