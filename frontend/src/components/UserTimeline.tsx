import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { PurchaseEvent } from '../types/purchaseHistory';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface UserTimelineProps {
  userId: string;
  userName?: string;
  userEmail?: string;
  referralCode: string;
  onClose: () => void;
}

interface TimelineEvent {
  id: string;
  type: 'purchase' | 'milestone';
  title: string;
  description: string;
  date: Date;
  metadata?: any;
}

export default function UserTimeline({
  userId,
  userName,
  userEmail,
  referralCode,
  onClose,
}: UserTimelineProps) {
  const [events, setEvents] = useState<PurchaseEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch referral details which includes purchase history
        const response = await apiService.getReferralDetails(referralCode);
        
        if (response.success && response.data) {
          // Find the specific user's data
          const userData = response.data.find(
            (user: any) => user.userId === userId
          );

          if (userData && userData.events) {
            // Events are already normalized by backend
            const purchaseEvents = userData.events.filter(
              (e: any) => e && typeof e === 'object'
            ) as PurchaseEvent[];
            setEvents(purchaseEvents);
          } else {
            setEvents([]);
          }
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching user timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, referralCode]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getEventTypeLabel = (event: PurchaseEvent) => {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        return event.period_type === 'TRIAL' ? 'Trial Started' : 'Paid Subscription';
      case 'RENEWAL':
        return 'Subscription Renewed';
      case 'CANCELLATION':
        return 'Subscription Cancelled';
      case 'SUBSCRIPTION_PAUSED':
        return 'Subscription Paused';
      default:
        return event.type;
    }
  };

  const getEventIcon = (event: PurchaseEvent) => {
    switch (event.type) {
      case 'INITIAL_PURCHASE':
        return event.period_type === 'TRIAL' ? '🆓' : '💳';
      case 'RENEWAL':
        return '🔄';
      case 'CANCELLATION':
        return '❌';
      case 'SUBSCRIPTION_PAUSED':
        return '⏸️';
      default:
        return '📅';
    }
  };

  // Sort events by date (newest first)
  const sortedEvents = [...events].sort(
    (a, b) => b.purchased_at_ms - a.purchased_at_ms
  );

  if (loading) {
    return (
      <div className="user-timeline-overlay" onClick={onClose}>
        <div className="user-timeline-modal" onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-timeline-overlay" onClick={onClose}>
        <div className="user-timeline-modal" onClick={(e) => e.stopPropagation()}>
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  return (
    <div className="user-timeline-overlay" onClick={onClose}>
      <div className="user-timeline-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-timeline-header">
          <div>
            <h2>User Timeline</h2>
            <div className="user-timeline-user-info">
              <p><strong>Name:</strong> {userName || 'N/A'}</p>
              <p><strong>Email:</strong> {userEmail || 'N/A'}</p>
              <p><strong>User ID:</strong> {userId}</p>
              <p><strong>Referral Code:</strong> {referralCode}</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="user-timeline-content">
          {sortedEvents.length === 0 ? (
            <div className="no-events">
              <p>No purchase history found for this user.</p>
            </div>
          ) : (
            <div className="timeline">
              {sortedEvents.map((event, index) => (
                <div key={`${event.id || index}-${event.purchased_at_ms}`} className="timeline-item">
                  <div className="timeline-marker">
                    <span className="timeline-icon">{getEventIcon(event)}</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h3>{getEventTypeLabel(event)}</h3>
                      <span className="timeline-date">{formatDate(event.purchased_at_ms)}</span>
                    </div>
                    <div className="timeline-details">
                      {event.type === 'INITIAL_PURCHASE' && (
                        <>
                          <p><strong>Product:</strong> {event.product_id}</p>
                          <p><strong>Type:</strong> {event.period_type}</p>
                          {event.price !== undefined && event.price > 0 && (
                            <p><strong>Price:</strong> {formatCurrency(event.price, event.currency)}</p>
                          )}
                          <p><strong>Store:</strong> {event.store}</p>
                          <p><strong>Country:</strong> {event.country_code}</p>
                        </>
                      )}
                      {event.type === 'RENEWAL' && (
                        <>
                          <p><strong>Product:</strong> {event.product_id}</p>
                          {event.price !== undefined && (
                            <p><strong>Price:</strong> {formatCurrency(event.price, event.currency)}</p>
                          )}
                        </>
                      )}
                      {event.transaction_id && (
                        <p><strong>Transaction ID:</strong> <code>{event.transaction_id}</code></p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


