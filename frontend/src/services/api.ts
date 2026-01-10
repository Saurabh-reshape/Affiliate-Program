import { API_CONFIG } from "../config/api";

type BackendApiResponse<T> = {
  message: string;
  success: boolean;
  data: T;
};

type AuthResponse = {
  success: boolean;
  message?: string;
  name?: string;
  email?: string;
};

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
    // const token = getAuthToken();
    // console.log(`API Request to ${url} with token: ${token}`);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // if (token) {
    //   headers["Authorization"] = `Bearer ${token}`;
    // }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Send HttpOnly cookies with requests
      mode: "cors", // Enable CORS
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // Ignore JSON parse errors, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
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
        method: "GET",
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
        method: "GET",
      }
    );
  }

  /**
   * Get affiliate referral codes with stats
   * Now uses JWT authentication - no affiliateUserId needed
   */
  async getAffiliateReferralCodes(): Promise<BackendApiResponse<any[]>> {
    return this.request<BackendApiResponse<any[]>>(
      `/get-affiliate-referral-codes`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get affiliate purchase history (full details)
   * Uses JWT authentication - affiliateUserId is optional (overridden by server for non-admins)
   */
  async getAffiliatePurchaseHistory(
    affiliateUserId?: string,
    referralCode?: string,
    userId?: string
  ): Promise<BackendApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (affiliateUserId) params.append("affiliateUserId", affiliateUserId);
    if (referralCode) params.append("referralCode", referralCode);
    if (userId) params.append("userId", userId);

    return this.request<BackendApiResponse<any[]>>(
      `/get-affiliate-purchase-history?${params.toString()}`,
      {
        method: "GET",
      }
    );
  }

  // ============================================
  // AUTHENTICATION APIs
  // ============================================

  /**
   * Login as affiliate user
   * Sets HttpOnly cookie on success
   */
  async affiliateLogin(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/affiliate-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // In production, ensure the response has name and email
    if (response.success) {
      // Add small delay to ensure cookie is set before subsequent requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return response;
  }

  /**
   * Logout affiliate user
   * Clears HttpOnly cookie
   */
  async affiliateLogout(): Promise<AuthResponse> {
    return this.request<AuthResponse>("/affiliate-logout", {
      method: "POST",
    });
  }

  /**
   * Get current authenticated user info
   * Validates JWT from HttpOnly cookie
   */
  async getAffiliateUser(): Promise<AuthResponse> {
    return this.request<AuthResponse>("/get-affiliate-user", {
      method: "GET",
    });
  }
}

export const apiService = new ApiService();
