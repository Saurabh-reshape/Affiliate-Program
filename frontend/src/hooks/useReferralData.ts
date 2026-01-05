import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { transformReferralCodes, calculateDashboardStats } from '../utils/transformers';
import { generateTimeSeriesWithFilledDates } from '../utils/timeSeries';
import type { ReferralCode, DashboardStats, TimeSeriesData } from '../types';
import type { PurchaseEvent } from '../types/purchaseHistory';

interface UseReferralDataReturn {
  referralCodes: ReferralCode[];
  stats: DashboardStats;
  timeSeriesData: TimeSeriesData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReferralData(): UseReferralDataReturn {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
      const [stats, setStats] = useState<DashboardStats>({
    totalReferralCodes: 0,
    totalConversions: 0,
    trialConversions: 0,
    paidConversions: 0,
  });
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getAdminReferralCodes();

      if (response.success && response.data) {
        // Transform backend data to frontend format
        let transformedCodes = transformReferralCodes(response.data);

        // Fetch purchase history for each referral code to get time series data
        // This uses get-referral-details which fetches from SQL PurchaseHistory table
        const allPurchaseEvents: PurchaseEvent[] = [];
        
        await Promise.all(
          transformedCodes.map(async (code) => {
            try {
              // get-referral-details fetches purchase history from SQL database
              // It returns user data with events array (already normalized by backend)
              const detailsResponse = await apiService.getReferralDetails(code.code);
              if (detailsResponse.success && detailsResponse.data) {
                // Process each user's purchase history
                detailsResponse.data.forEach((userData: any) => {
                  // Backend normalizes events, so they should be an array of event objects
                  if (userData.events && Array.isArray(userData.events)) {
                    userData.events.forEach((event: any) => {
                      // Events are already normalized by backend from SQL JSON field
                      // Just verify it's an INITIAL_PURCHASE event
                      if (event && event.type === 'INITIAL_PURCHASE') {
                        // Validate event structure matches PurchaseEvent
                        if (event.purchased_at_ms && event.period_type) {
                          allPurchaseEvents.push(event as PurchaseEvent);
                        }
                      }
                    });
                  }
                });
              }
            } catch (err) {
              console.warn(`Failed to fetch purchase history for code ${code.code}:`, err);
            }
          })
        );

        setReferralCodes(transformedCodes);

        // Calculate stats
        const calculatedStats = calculateDashboardStats(transformedCodes);
        setStats(calculatedStats);

        // Generate time series data from actual purchase events
        const timeSeries = generateTimeSeriesWithFilledDates(allPurchaseEvents, 30);
        setTimeSeriesData(timeSeries);
      } else {
        setError(response.message || 'Failed to fetch referral codes');
        setReferralCodes([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching referral data:', err);
      setReferralCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    referralCodes,
    stats,
    timeSeriesData,
    loading,
    error,
    refetch: fetchData,
  };
}

