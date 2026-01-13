import "./App.css";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import LoadingSpinner from "./components/LoadingSpinner";
import { useReferralData } from "./hooks/useReferralData";
import { useAuth, AuthProvider } from "./context/AuthContext";
import type { User } from "./types";

function AppContent() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const {
    referralCodes,
    stats,
    timeSeriesData,
    loadingCodes,
    loadingHistory,
    error,
    refetch,
    rawReferralCodesResponse,
    rawPurchaseHistoryResponse,
  } = useReferralData(isAuthenticated);

  // Show loading spinner while checking auth status
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  // Transform auth user to User type for Dashboard
  const dashboardUser: User = {
    id: user.email,
    name: user.name,
    email: user.email,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.name
    )}&background=40E5B7&color=0E1412`,
  };

  return (
    <Dashboard
      user={dashboardUser}
      referralCodes={referralCodes}
      stats={stats}
      timeSeriesData={timeSeriesData}
      loadingCodes={loadingCodes}
      loadingHistory={loadingHistory}
      error={error}
      onRetry={refetch}
      onLogout={logout}
      rawReferralCodesResponse={rawReferralCodesResponse}
      rawPurchaseHistoryResponse={rawPurchaseHistoryResponse}
    />
  );
}

import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
