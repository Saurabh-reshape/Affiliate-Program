import { API_CONFIG, getAuthToken } from '../config/api';
import type { BackendApiResponse, BackendReferral } from '../types/backend';

/**
 * API Service for fetching referral data from backend
 */

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Get all admin referral codes (codes with no referrer)
   */
  async getAdminReferralCodes(): Promise<BackendApiResponse<BackendReferral[]>> {
    return this.request<BackendApiResponse<BackendReferral[]>>(
      '/get-admin-referralcode',
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get referral details with purchase history
   * This fetches data from SQL PurchaseHistory table via get-referral-details endpoint
   */
  async getReferralDetails(
    referralCode: string
  ): Promise<BackendApiResponse<any[]>> {
    return this.request<BackendApiResponse<any[]>>(
      `/get-referral-details?referralCode=${encodeURIComponent(referralCode)}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get purchase history for a specific user
   * Fetches directly from SQL PurchaseHistory table
   */
  async getPurchaseHistoryByUserId(
    userId: string
  ): Promise<BackendApiResponse<{ userId: string; events: any[] }>> {
    return this.request<BackendApiResponse<{ userId: string; events: any[] }>>(
      `/get-purchasehistory?userId=${encodeURIComponent(userId)}`,
      {
        method: 'GET',
      }
    );
  }
}

export const apiService = new ApiService();

