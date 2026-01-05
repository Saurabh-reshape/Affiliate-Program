import './App.css'
import Dashboard from './components/Dashboard'
import { useReferralData } from './hooks/useReferralData'
import { mockUser } from './data/mockData'

function App() {
  const { referralCodes, stats, timeSeriesData, loading, error, refetch } = useReferralData()

  return (
    <Dashboard
      user={mockUser}
      referralCodes={referralCodes}
      stats={stats}
      timeSeriesData={timeSeriesData}
      loading={loading}
      error={error}
      onRetry={refetch}
    />
  )
}

export default App
