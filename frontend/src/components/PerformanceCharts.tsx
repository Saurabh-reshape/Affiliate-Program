import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimeSeriesData } from '../types';
import DateRangeSelector from './DateRangeSelector';

interface PerformanceChartsProps {
  timeSeriesData: TimeSeriesData[];
}

export default function PerformanceCharts({ timeSeriesData }: PerformanceChartsProps) {
  // Get default date range (last 30 days)
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return timeSeriesData.filter((item) => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [timeSeriesData, startDate, endDate]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare data for charts
  const chartData = filteredData.map(item => ({
    ...item,
    dateFormatted: formatDate(item.date)
  }));

  const handleReset = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
  };

  return (
    <div className="charts-section">
      <div className="chart-header">
        <h2 className="section-title">Performance Overview</h2>
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReset={handleReset}
        />
      </div>
      <div className="chart-card">
        <h3 className="chart-title">Conversions Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dateFormatted" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="conversions" 
              stroke="#6366f1" 
              strokeWidth={2}
              name="Total Conversions"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="trialConversions" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Free Trial"
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="paidConversions" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Paid"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

