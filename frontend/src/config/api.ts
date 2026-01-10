// API Configuration
// NOTE: In production, ensure the backend URL matches the domain where this frontend is deployed
// This is critical for SameSite=None cookies to work properly
export const API_CONFIG = {
  // Production backend URL - uncomment when deploying
  baseURL: "https://reshape-support-backend.azurewebsites.net/api",

  // Local development
  // baseURL: "http://localhost:7071/api",
  timeout: 20000, // 20 seconds
};
