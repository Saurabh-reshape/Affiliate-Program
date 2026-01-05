import type { PurchaseEvent, PurchaseHistoryRecord } from '../types/purchaseHistory';

/**
 * Parse purchase history event string to array
 */
export function parsePurchaseEvents(record: PurchaseHistoryRecord): PurchaseEvent[] {
  if (Array.isArray(record.event)) {
    return record.event;
  }
  
  if (typeof record.event === 'string') {
    try {
      const parsed = JSON.parse(record.event);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Error parsing purchase events:', error);
      return [];
    }
  }
  
  return [];
}

/**
 * Calculate revenue from purchase events
 */
export function calculateRevenueFromEvents(events: PurchaseEvent[]): number {
  return events.reduce((total, event) => {
    // Only count INITIAL_PURCHASE with NORMAL period_type as revenue
    // TRIAL purchases have price 0, so we can include all INITIAL_PURCHASE
    if (event.type === 'INITIAL_PURCHASE') {
      return total + (event.price || 0);
    }
    return total;
  }, 0);
}

/**
 * Count conversions from purchase events
 */
export function countConversionsFromEvents(events: PurchaseEvent[]): {
  trial: number;
  paid: number;
} {
  const conversions = {
    trial: 0,
    paid: 0,
  };

  events.forEach((event) => {
    if (event.type === 'INITIAL_PURCHASE') {
      if (event.period_type === 'TRIAL') {
        conversions.trial++;
      } else if (event.period_type === 'NORMAL') {
        conversions.paid++;
      }
    }
  });

  return conversions;
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

