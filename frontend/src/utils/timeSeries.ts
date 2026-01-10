import type { TimeSeriesData } from "../types";

function toDateKey(value: unknown): string | null {
  if (!value) return null;

  const date =
    value instanceof Date
      ? value
      : typeof value === "number"
      ? new Date(value)
      : typeof value === "string"
      ? new Date(value)
      : null;

  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

interface UserWithEvents {
  referralCreatedAt?: string | Date | number | null;
  events?: any[];
  userId?: string; // Optional user identifier for unique tracking
}

/**
 * Classify a raw purchase event into a commission category.
 * Returns "free_trial", "purchase", or null (event should be ignored).
 *
 * Classification rules:
 * - INITIAL_PURCHASE + TRIAL → "free_trial"
 * - INITIAL_PURCHASE + NORMAL → "purchase"
 * - RENEWAL (any period_type) → "purchase"
 * - Anything else → null (ignored)
 */
export function trialVsPurchaseIdentifier(
  event: any
): "free_trial" | "purchase" | null {
  if (event.type === "INITIAL_PURCHASE" && event.period_type === "TRIAL") {
    return "free_trial";
  } else if (
    event.type === "INITIAL_PURCHASE" &&
    event.period_type === "NORMAL"
  ) {
    return "purchase";
  } else if (event.type === "RENEWAL") {
    return "purchase";
  }
  return null; // Event is ignored
}

/**
 * Build time series data from users array.
 * Uses one-time commission model: each user is counted only once
 * for free_trial and only once for purchase per day.
 *
 * Supports both legacy INITIAL_PURCHASE events and dynamic events.
 */
export function buildTimeSeriesFromUsers(
  users: UserWithEvents[],
  startDate?: string | Date | null,
  endDate?: string | Date | null
): TimeSeriesData[] {
  const dateMap = new Map<string, TimeSeriesData>();

  // Determine date range
  let start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : new Date();

  // If no start date, default to 30 days ago
  if (!start) {
    const today = new Date();
    start = new Date(today.setDate(today.getDate() - 30));
  }

  // Initialize date map with zeros for the range
  if (start && !isNaN(start.getTime())) {
    const current = new Date(start);
    while (current <= end) {
      const d = toDateKey(current);
      if (d) {
        dateMap.set(d, { date: d, eventCounts: {} });
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // 1. Process Signups - add as signup event
  users.forEach((user) => {
    const d = toDateKey(user.referralCreatedAt);
    if (d) {
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, eventCounts: {} });
      }
      const node = dateMap.get(d)!;
      node.eventCounts.signup = (node.eventCounts.signup || 0) + 1;
    }
  });

  // 2. Process Events - One-time commission model per user per event type
  // Track unique users per date per event type
  // Map structure: date -> eventType -> Set of userIds
  const userTrackingMap = new Map<string, Map<string, Set<string>>>();

  users.forEach((user, userIndex) => {
    if (!user.events || !Array.isArray(user.events)) return;

    // Use userId if available, otherwise use index as fallback identifier
    const userIdentifier = user.userId || `user_${userIndex}`;

    // Track first occurrence of each event type for this user (by date)
    const userFirstEventByType = new Map<
      string,
      { date: string; event: any }
    >();

    // Sort events by date to find the first of each type
    const sortedEvents = [...user.events].sort((a, b) => {
      const dateA = a.purchased_at_ms || a.date || a.createdAt || 0;
      const dateB = b.purchased_at_ms || b.date || b.createdAt || 0;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    sortedEvents.forEach((event) => {
      let eventType = event.type;
      let dateVal = event.date || event.purchased_at_ms || event.createdAt;

      // Handle raw RevenueCat events (INITIAL_PURCHASE, RENEWAL)
      if (event.type === "INITIAL_PURCHASE" || event.type === "RENEWAL") {
        const category = trialVsPurchaseIdentifier(event);
        if (!category) return; // Skip ignored events
        eventType = category;
        dateVal = event.purchased_at_ms;
      }

      const d = toDateKey(dateVal);
      if (d && eventType) {
        // Only count the first occurrence of each event type for this user
        if (!userFirstEventByType.has(eventType)) {
          userFirstEventByType.set(eventType, { date: d, event });
        }
      }
    });

    // Now add to the tracking map (only first occurrences)
    userFirstEventByType.forEach(({ date: d }, eventType) => {
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, eventCounts: {} });
      }

      if (!userTrackingMap.has(d)) {
        userTrackingMap.set(d, new Map());
      }
      const dateTracking = userTrackingMap.get(d)!;

      if (!dateTracking.has(eventType)) {
        dateTracking.set(eventType, new Set());
      }
      const userSet = dateTracking.get(eventType)!;

      // Only increment if user not already counted for this event type on this date
      if (!userSet.has(userIdentifier)) {
        userSet.add(userIdentifier);
        const node = dateMap.get(d)!;
        node.eventCounts[eventType] = (node.eventCounts[eventType] || 0) + 1;
      }
    });
  });

  return Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Get the earliest date from an array of events
 * Supports legacy PurchaseEvent (purchased_at_ms) and generalized events (date/createdAt)
 */
export function getEarliestEventDate(events: any[]): string | null {
  if (!events || events.length === 0) return null;

  let earliest: number | null = null;

  events.forEach((e) => {
    // Try to find a valid timestamp
    const val = e.purchased_at_ms || e.date || e.createdAt;
    const d = new Date(val);

    if (!isNaN(d.getTime())) {
      const ts = d.getTime();
      if (earliest === null || ts < earliest) {
        earliest = ts;
      }
    }
  });

  if (earliest === null) return null;
  return new Date(earliest).toISOString().split("T")[0];
}
