// Commission Rate Configuration
// These rates define how much an influencer earns per conversion

export interface CommissionRate {
  perTrialConversion: number; // Rate per trial conversion
  perPaidConversion: number; // Rate per paid conversion
  currency: string; // Currency code (USD, EUR, etc.)
}

// Default commission rates
// TODO: Make this configurable per influencer or per code in Phase 2
export const DEFAULT_COMMISSION_RATES: CommissionRate = {
  perTrialConversion: 2.0, // $2 per trial conversion
  perPaidConversion: 10.0, // $10 per paid conversion
  currency: "USD",
};

// Get commission rates (can be extended to fetch from API in future)
export function getCommissionRates(): CommissionRate {
  // For Phase 1: return default rates
  // Phase 2: Can fetch from API or use per-code rates
  return DEFAULT_COMMISSION_RATES;
}

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
