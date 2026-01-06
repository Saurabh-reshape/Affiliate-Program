import type {
  User,
  ReferralCode,
  ReferralEvent,
  DashboardStats,
  TimeSeriesData,
} from "../types";

// Hardcoded user data (Phase 1)
export const mockUser: User = {
  id: "user-1",
  name: "test influencer",
  email: "testing@influencer.com",
  role: "influencer",
  avatar:
    "https://ui-avatars.com/api/?name=test+influencer&background=6366f1&color=fff",
};
