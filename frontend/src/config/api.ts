// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7071/api',
  timeout: 10000, // 10 seconds
};

// Get auth token from localStorage or environment
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || import.meta.env.VITE_AUTH_TOKEN || null;
};

