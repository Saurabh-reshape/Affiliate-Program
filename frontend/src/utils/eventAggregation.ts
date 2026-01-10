/**
 * Event Aggregation Utilities
 *
 * Handles union creation, aggregation, and time-series generation
 * from the enriched backend response.
 *
 * Key concepts:
 * - Union Map: A Map of all unique event types across all referral codes
 * - Global Totals: Sum of counts for each event type
 * - Time Series: Aligned timestamps with all event types filled (0 for missing)
 */

import type {
  EnrichedReferralCodeData,
  EventMetadata,
  EventUnionMap,
  AffiliatePurchaseHistoryByCode,
  CommissionRule,
} from "../types/commission";
import type { TimeSeriesData } from "../types";

// Re-export types for convenience
export type { EventUnionMap, EventMetadata } from "../types/commission";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Event types that represent purchase/payment actions.
 * These are used for display categorization.
 *
 * Note: RENEWAL is treated as "purchase" for commission purposes.
 * Stats show unique user counts, not event counts.
 */
const PURCHASE_EVENT_TYPES = new Set([
  "purchase",
  "free_trial",
  "subscription",
  "renewal", // RENEWAL events count as purchase for commission
]);

// ─────────────────────────────────────────────────────────────────────────────
// Union Map Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if an event type is a purchase/trial type
 */
export function isPurchaseEventType(eventType: string): boolean {
  return PURCHASE_EVENT_TYPES.has(eventType.toLowerCase());
}

/**
 * Format event name for display (fallback when no display_name available)
 * e.g., "3_meals_logged" -> "3 Meals Logged"
 */
export function formatEventNameForDisplay(eventName: string): string {
  return eventName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build union map from enriched referral codes
 * This becomes the "source of truth" for what columns/metrics to render
 */
export function buildEventUnionMap(
  referralCodes: EnrichedReferralCodeData[]
): EventUnionMap {
  const unionMap: EventUnionMap = new Map();

  for (const code of referralCodes) {
    for (const event of code.events) {
      // Only add if not already in map (first occurrence wins for display name)
      if (!unionMap.has(event.commission_event_name)) {
        unionMap.set(event.commission_event_name, {
          displayName: event.display_name,
          isPurchaseType: isPurchaseEventType(event.commission_event_name),
        });
      }
    }
  }

  return unionMap;
}

/**
 * Build union map from commission configs (used when enriched data not available)
 */
export function buildEventUnionMapFromCommissionConfigs(
  commissionConfigs: CommissionRule[][]
): EventUnionMap {
  const unionMap: EventUnionMap = new Map();

  for (const configs of commissionConfigs) {
    for (const config of configs) {
      if (!unionMap.has(config.event)) {
        unionMap.set(config.event, {
          displayName:
            config.display_name || formatEventNameForDisplay(config.event),
          isPurchaseType: isPurchaseEventType(config.event),
        });
      }
    }
  }

  return unionMap;
}

/**
 * Build union map from legacy purchase history response
 */
export function buildEventUnionMapFromLegacy(
  codes: AffiliatePurchaseHistoryByCode[]
): EventUnionMap {
  const unionMap: EventUnionMap = new Map();

  // Defensive check: ensure codes is an array
  if (!codes || !Array.isArray(codes)) {
    return unionMap;
  }

  for (const code of codes) {
    // Add from commission config
    for (const config of code.commissionConfig || []) {
      if (!unionMap.has(config.event)) {
        unionMap.set(config.event, {
          displayName:
            config.display_name || formatEventNameForDisplay(config.event),
          isPurchaseType: isPurchaseEventType(config.event),
        });
      }
    }

    // Add from events if available (new format)
    if (code.events) {
      for (const event of code.events) {
        if (!unionMap.has(event.commission_event_name)) {
          unionMap.set(event.commission_event_name, {
            displayName: event.display_name,
            isPurchaseType: isPurchaseEventType(event.commission_event_name),
          });
        }
      }
    }
  }

  return unionMap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Aggregation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate event counts across all referral codes
 * Returns totals for each event type in the union map
 */
export function aggregateGlobalTotals(
  referralCodes: EnrichedReferralCodeData[],
  unionMap: EventUnionMap
): Record<string, number> {
  // Initialize all event types to 0
  const totals: Record<string, number> = {};
  for (const eventName of unionMap.keys()) {
    totals[eventName] = 0;
  }

  // Sum up counts from all codes
  for (const code of referralCodes) {
    for (const event of code.events) {
      if (totals.hasOwnProperty(event.commission_event_name)) {
        totals[event.commission_event_name] += event.count;
      }
    }
  }

  return totals;
}

/**
 * Aggregate from legacy format
 */
export function aggregateGlobalTotalsFromLegacy(
  codes: AffiliatePurchaseHistoryByCode[],
  unionMap: EventUnionMap
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const eventName of unionMap.keys()) {
    totals[eventName] = 0;
  }

  for (const code of codes) {
    // Use enriched events if available
    if (code.events) {
      for (const event of code.events) {
        if (totals.hasOwnProperty(event.commission_event_name)) {
          totals[event.commission_event_name] += event.count;
        }
      }
    } else {
      // Fallback to stats object
      const stats = code.stats || {};
      for (const eventName of unionMap.keys()) {
        if (typeof stats[eventName] === "number") {
          totals[eventName] += stats[eventName];
        }
      }
    }
  }

  return totals;
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Series Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate time series data from enriched events
 * Aligns all events by date with all union event types
 */
export function generateTimeSeriesFromEnrichedEvents(
  referralCodes: EnrichedReferralCodeData[],
  unionMap: EventUnionMap,
  startDate?: string,
  endDate?: string
): TimeSeriesData[] {
  // Collect all timestamps and group by date
  const dateCountsMap: Map<string, Record<string, number>> = new Map();

  for (const code of referralCodes) {
    for (const event of code.events) {
      for (const timestamp of event.timestamps) {
        const dateKey = timestamp.split("T")[0]; // Extract date portion

        if (!dateCountsMap.has(dateKey)) {
          // Initialize with all events at 0
          const counts: Record<string, number> = {};
          for (const eventName of unionMap.keys()) {
            counts[eventName] = 0;
          }
          dateCountsMap.set(dateKey, counts);
        }

        const counts = dateCountsMap.get(dateKey)!;
        if (counts.hasOwnProperty(event.commission_event_name)) {
          counts[event.commission_event_name]++;
        }
      }
    }
  }

  // Determine desired range
  const todayIso = new Date().toISOString().split("T")[0];
  const rangeStartIso =
    startDate ||
    (dateCountsMap.size > 0
      ? Array.from(dateCountsMap.keys()).sort()[0]
      : new Date(new Date().setDate(new Date().getDate() - 30))
          .toISOString()
          .split("T")[0]);
  const rangeEndIso = endDate || todayIso;

  // Fill all dates in range with zeros when missing
  const filledDates: string[] = [];
  const start = new Date(rangeStartIso);
  const end = new Date(rangeEndIso);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split("T")[0];
    filledDates.push(dateKey);
    if (!dateCountsMap.has(dateKey)) {
      const counts: Record<string, number> = {};
      for (const eventName of unionMap.keys()) {
        counts[eventName] = 0;
      }
      dateCountsMap.set(dateKey, counts);
    }
  }

  let dates = filledDates;

  // Build time series data
  return dates.map((date) => {
    const counts = dateCountsMap.get(date) || {};

    return {
      date,
      signupConversions: 0, // Signups don't come from events
      eventCounts: counts,
      // Legacy fields
      trialConversions: counts["free_trial"] || 0,
      paidConversions: counts["purchase"] || 0,
    };
  });
}

/**
 * Generate time series from legacy purchase history format
 */
export function generateTimeSeriesFromLegacyHistory(
  codes: AffiliatePurchaseHistoryByCode[],
  unionMap: EventUnionMap,
  startDate?: string,
  endDate?: string
): TimeSeriesData[] {
  // Try to use enriched events first
  const enrichedCodes: EnrichedReferralCodeData[] = codes
    .filter((c) => c.events && c.events.length > 0)
    .map((c) => ({
      code: c.referralCode,
      events: c.events!,
    }));

  if (enrichedCodes.length > 0) {
    return generateTimeSeriesFromEnrichedEvents(
      enrichedCodes,
      unionMap,
      startDate,
      endDate
    );
  }

  // Fallback: Extract from user events (legacy format)
  const dateCountsMap: Map<string, Record<string, number>> = new Map();

  for (const code of codes) {
    for (const user of code.users || []) {
      for (const event of user.events || []) {
        if (!event.date) continue;

        const dateKey = event.date.split("T")[0];

        if (!dateCountsMap.has(dateKey)) {
          const counts: Record<string, number> = {};
          for (const eventName of unionMap.keys()) {
            counts[eventName] = 0;
          }
          dateCountsMap.set(dateKey, counts);
        }

        const counts = dateCountsMap.get(dateKey)!;
        if (counts.hasOwnProperty(event.type)) {
          counts[event.type]++;
        }
      }
    }
  }

  // Determine desired range (default last 30 days when sparse)
  const todayIso = new Date().toISOString().split("T")[0];
  const rangeStartIso =
    startDate ||
    (dateCountsMap.size > 0
      ? Array.from(dateCountsMap.keys()).sort()[0]
      : new Date(new Date().setDate(new Date().getDate() - 30))
          .toISOString()
          .split("T")[0]);
  const rangeEndIso = endDate || todayIso;

  const dates: string[] = [];
  const start = new Date(rangeStartIso);
  const end = new Date(rangeEndIso);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split("T")[0];
    dates.push(dateKey);
    if (!dateCountsMap.has(dateKey)) {
      const counts: Record<string, number> = {};
      for (const eventName of unionMap.keys()) {
        counts[eventName] = 0;
      }
      dateCountsMap.set(dateKey, counts);
    }
  }

  return dates.map((date) => {
    const counts = dateCountsMap.get(date) || {};
    return {
      date,
      signupConversions: 0,
      eventCounts: counts,
      trialConversions: counts["free_trial"] || 0,
      paidConversions: counts["purchase"] || 0,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter events by selected referral codes
 * Union map stays constant to prevent column jumping
 */
export function filterByReferralCodes(
  allCodes: EnrichedReferralCodeData[],
  selectedCodes: string[]
): EnrichedReferralCodeData[] {
  if (!selectedCodes || selectedCodes.length === 0) {
    return allCodes;
  }

  const selectedSet = new Set(selectedCodes);
  return allCodes.filter((code) => selectedSet.has(code.code));
}

/**
 * Get display name for an event type
 */
export function getEventDisplayName(
  eventName: string,
  unionMap: EventUnionMap
): string {
  const metadata = unionMap.get(eventName);
  return metadata?.displayName || formatEventNameForDisplay(eventName);
}

/**
 * Convert union map to array for rendering
 */
export function unionMapToArray(
  unionMap: EventUnionMap
): Array<{ eventName: string; metadata: EventMetadata }> {
  return Array.from(unionMap.entries()).map(([eventName, metadata]) => ({
    eventName,
    metadata,
  }));
}
