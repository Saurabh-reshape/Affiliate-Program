import type { TimeSeriesData } from "../types";
import type { PurchaseEvent } from "../types/purchaseHistory";

/**
 * Generate time series data from purchase history events
 */
export function generateTimeSeriesFromEvents(
  events: PurchaseEvent[]
): TimeSeriesData[] {
  const dateMap = new Map<
    string,
    {
      conversions: number;
      trialConversions: number;
      paidConversions: number;
    }
  >();

  // Process all events and group by date
  events.forEach((event) => {
    if (event.type === "INITIAL_PURCHASE") {
      // Convert timestamp to date string (YYYY-MM-DD)
      const eventDate = new Date(event.purchased_at_ms);
      const dateKey = eventDate.toISOString().split("T")[0];

      // Initialize date entry if not exists
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          conversions: 0,
          trialConversions: 0,
          paidConversions: 0,
        });
      }

      const dayData = dateMap.get(dateKey)!;
      dayData.conversions++;

      if (event.period_type === "TRIAL") {
        dayData.trialConversions++;
      } else if (event.period_type === "NORMAL") {
        dayData.paidConversions++;
      }
    }
  });

  // Convert map to array and sort by date
  const data: TimeSeriesData[] = Array.from(dateMap.entries())
    .map(([date, values]) => ({
      date,
      conversions: values.conversions,
      trialConversions: values.trialConversions,
      paidConversions: values.paidConversions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return data;
}

/**
 * Generate time series data for last N days, filling in missing dates with zeros
 */
export function generateTimeSeriesWithFilledDates(
  events: PurchaseEvent[],
  days: number = 30
): TimeSeriesData[] {
  const today = new Date();
  const dateMap = new Map<
    string,
    {
      conversions: number;
      trialConversions: number;
      paidConversions: number;
    }
  >();

  // Initialize all dates with zeros
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    dateMap.set(dateKey, {
      conversions: 0,
      trialConversions: 0,
      paidConversions: 0,
    });
  }

  // Process events and update dates
  events.forEach((event) => {
    if (event.type === "INITIAL_PURCHASE") {
      const eventDate = new Date(event.purchased_at_ms);
      const dateKey = eventDate.toISOString().split("T")[0];

      if (dateMap.has(dateKey)) {
        const dayData = dateMap.get(dateKey)!;
        dayData.conversions++;

        if (event.period_type === "TRIAL") {
          dayData.trialConversions++;
        } else if (event.period_type === "NORMAL") {
          dayData.paidConversions++;
        }
      }
    }
  });

  // Convert to array and sort
  return Array.from(dateMap.entries())
    .map(([date, values]) => ({
      date,
      conversions: values.conversions,
      trialConversions: values.trialConversions,
      paidConversions: values.paidConversions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate time series data with custom date range
 * @param events - Array of purchase events
 * @param startDate - Start date (YYYY-MM-DD) or Date object
 * @param endDate - End date (YYYY-MM-DD) or Date object (default: today)
 * @returns Time series data filled with zeros for dates with no events
 */
export function generateTimeSeriesWithDateRange(
  events: PurchaseEvent[],
  startDate: string | Date,
  endDate?: string | Date
): TimeSeriesData[] {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = endDate
    ? typeof endDate === "string"
      ? new Date(endDate)
      : endDate
    : new Date();

  const dateMap = new Map<
    string,
    {
      conversions: number;
      trialConversions: number;
      paidConversions: number;
    }
  >();

  // Initialize all dates in range with zeros
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateKey = currentDate.toISOString().split("T")[0];
    dateMap.set(dateKey, {
      conversions: 0,
      trialConversions: 0,
      paidConversions: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Process events and update dates
  events.forEach((event) => {
    if (event.type === "INITIAL_PURCHASE") {
      const eventDate = new Date(event.purchased_at_ms);
      const dateKey = eventDate.toISOString().split("T")[0];

      if (dateMap.has(dateKey)) {
        const dayData = dateMap.get(dateKey)!;
        dayData.conversions++;

        if (event.period_type === "TRIAL") {
          dayData.trialConversions++;
        } else if (event.period_type === "NORMAL") {
          dayData.paidConversions++;
        }
      }
    }
  });

  // Convert to array and sort
  return Array.from(dateMap.entries())
    .map(([date, values]) => ({
      date,
      conversions: values.conversions,
      trialConversions: values.trialConversions,
      paidConversions: values.paidConversions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get the earliest date from an array of purchase events
 * @param events - Array of purchase events
 * @returns The earliest date as YYYY-MM-DD string, or null if no events
 */
export function getEarliestEventDate(events: PurchaseEvent[]): string | null {
  if (events.length === 0) return null;

  const timestamps = events
    .filter((e) => e.type === "INITIAL_PURCHASE" && e.purchased_at_ms)
    .map((e) => e.purchased_at_ms);

  if (timestamps.length === 0) return null;

  const earliestTimestamp = Math.min(...timestamps);
  const date = new Date(earliestTimestamp);
  return date.toISOString().split("T")[0];
}
