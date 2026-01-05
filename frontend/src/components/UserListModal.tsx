import { useState } from 'react';
import UserTimeline from './UserTimeline';

interface User {
  userId: string;
  email: string | null;
  name: string | null;
  subscriptionInfo?: any;
  events?: any[];
}

interface UserListModalProps {
  referralCode: string;
  users: User[];
  onClose: () => void;
}

export default function UserListModal({
  referralCode,
  users,
  onClose,
}: UserListModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (selectedUser) {
    return (
      <UserTimeline
        userId={selectedUser.userId}
        userName={selectedUser.name || undefined}
        userEmail={selectedUser.email || undefined}
        referralCode={referralCode}
        onClose={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="user-list-overlay" onClick={onClose}>
      <div className="user-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="user-list-header">
          <h2>Users for Referral Code: {referralCode}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="user-list-content">
          {users.length === 0 ? (
            <p className="no-users">No users found for this referral code.</p>
          ) : (
            <table className="user-list-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>User ID</th>
                  <th>Events</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td><code className="user-id-code">{user.userId}</code></td>
                    <td>{user.events?.length || 0} events</td>
                    <td>
                      <button
                        className="view-timeline-button"
                        onClick={() => setSelectedUser(user)}
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}


