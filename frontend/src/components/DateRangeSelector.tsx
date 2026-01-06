interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onReset: () => void;
  resetStartDate?: string;
  resetEndDate?: string;
  resetLabel?: string;
  showResetButton?: boolean;
}

export default function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  resetStartDate,
  resetEndDate,
  resetLabel = "Reset to 30 Days",
  showResetButton = true,
}: DateRangeSelectorProps) {
  // Default reset range is last 30 days
  const getResetStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  const getResetEndDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const effectiveResetStart = resetStartDate ?? getResetStartDate();
  const effectiveResetEnd = resetEndDate ?? getResetEndDate();

  const isDefaultRange =
    startDate === effectiveResetStart && endDate === effectiveResetEnd;

  return (
    <div className="date-range-selector">
      <div className="date-range-controls">
        <div className="date-input-group">
          <label htmlFor="start-date">From:</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            max={endDate}
            className="date-input"
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="end-date">To:</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate}
            max={getResetEndDate()}
            className="date-input"
          />
        </div>
        {!isDefaultRange && showResetButton && (
          <button onClick={onReset} className="reset-date-button">
            {resetLabel}
          </button>
        )}
      </div>
    </div>
  );
}
