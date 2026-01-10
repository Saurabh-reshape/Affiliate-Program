import type {
  PurchaseEvent,
  PurchaseHistoryRecord,
} from "../types/purchaseHistory";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPurchaseEventLike(value: unknown): value is PurchaseEvent {
  if (!isRecord(value)) return false;

  return (
    typeof value.event_timestamp_ms === "number" &&
    typeof value.product_id === "string" &&
    typeof value.period_type === "string" &&
    typeof value.purchased_at_ms === "number" &&
    typeof value.expiration_at_ms === "number" &&
    typeof value.environment === "string" &&
    typeof value.transaction_id === "string" &&
    typeof value.original_transaction_id === "string" &&
    typeof value.country_code === "string" &&
    typeof value.app_user_id === "string" &&
    typeof value.currency === "string" &&
    typeof value.price === "number" &&
    typeof value.price_in_purchased_currency === "number" &&
    typeof value.store === "string" &&
    typeof value.takehome_percentage === "number" &&
    typeof value.tax_percentage === "number" &&
    typeof value.commission_percentage === "number" &&
    typeof value.type === "string" &&
    typeof value.id === "string" &&
    typeof value.app_id === "string"
  );
}

/**
 * Parse purchase history event string to array
 */
export function parsePurchaseEvents(
  record: PurchaseHistoryRecord
): PurchaseEvent[] {
  if (Array.isArray(record.event)) {
    return record.event.filter(isPurchaseEventLike);
  }

  if (typeof record.event === "string") {
    try {
      const parsed: unknown = JSON.parse(record.event);
      if (Array.isArray(parsed)) {
        return parsed.filter(isPurchaseEventLike);
      }
      return isPurchaseEventLike(parsed) ? [parsed] : [];
    } catch (error) {
      console.error("Error parsing purchase events:", error);
      return [];
    }
  }

  return [];
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
  event: PurchaseEvent
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
 * Calculate revenue from purchase events.
 * Includes both INITIAL_PURCHASE and RENEWAL events.
 */
export function calculateRevenueFromEvents(events: PurchaseEvent[]): number {
  return events.reduce((total, event) => {
    // Count revenue from INITIAL_PURCHASE (NORMAL) and RENEWAL events
    if (event.type === "INITIAL_PURCHASE" && event.period_type === "NORMAL") {
      return total + (event.price || 0);
    }
    if (event.type === "RENEWAL") {
      return total + (event.price || 0);
    }
    return total;
  }, 0);
}

/**
 * Count conversions from purchase events using one-time commission model.
 * Each user is counted only once for trial and only once for purchase.
 *
 * A user can be counted in BOTH trial AND purchase if they have both.
 * RENEWAL events count as "purchase" (user who only has renewals counts as purchase).
 *
 * @param events - Array of purchase events (should be for a single user)
 * @returns { trial: 0|1, paid: 0|1 } - Binary flags for this user
 */
export function countConversionsFromEvents(events: PurchaseEvent[]): {
  trial: number;
  paid: number;
} {
  const conversions = {
    trial: 0,
    paid: 0,
  };

  // One-time commission: count each type only once per user
  let hasFreeTrial = false;
  let hasPurchase = false;

  events.forEach((event) => {
    const category = trialVsPurchaseIdentifier(event);
    if (category === "free_trial" && !hasFreeTrial) {
      hasFreeTrial = true;
      conversions.trial = 1;
    } else if (category === "purchase" && !hasPurchase) {
      hasPurchase = true;
      conversions.paid = 1;
    }
  });

  return conversions;
}

/**
 * Count conversions across multiple users' events.
 * Uses one-time commission model: each user counted only once per event type.
 *
 * @param usersEvents - Array of event arrays, one per user
 * @returns Total unique users with trial and unique users with purchase
 */
export function countConversionsFromMultipleUsers(
  usersEvents: PurchaseEvent[][]
): { trial: number; paid: number } {
  return usersEvents.reduce(
    (totals, userEvents) => {
      const userConversions = countConversionsFromEvents(userEvents);
      return {
        trial: totals.trial + userConversions.trial,
        paid: totals.paid + userConversions.paid,
      };
    },
    { trial: 0, paid: 0 }
  );
}

/**
 * Get events by date range
 */
export function getEventsByDateRange(
  events: PurchaseEvent[],
  startDate: Date,
  endDate: Date
): PurchaseEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.purchased_at_ms);
    return eventDate >= startDate && eventDate <= endDate;
  });
}
