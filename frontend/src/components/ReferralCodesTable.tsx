import { useState } from 'react';
import type { ReferralCode } from '../types';
import UserListModal from './UserListModal';
import { apiService } from '../services/api';

interface ReferralCodesTableProps {
  codes: ReferralCode[];
}

export default function ReferralCodesTable({ codes }: ReferralCodesTableProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const handleViewUsers = async (code: string) => {
    try {
      setLoadingUsers(true);
      const response = await apiService.getReferralDetails(code);
      if (response.success && response.data) {
        setUsers(response.data);
        setSelectedCode(code);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="referral-codes-section">
      <h2 className="section-title">My Referral Codes</h2>
      <div className="table-container">
        <table className="referral-codes-table">
          <thead>
            <tr>
              <th>Referral Code</th>
              <th>Created</th>
              <th>Total Conversions</th>
              <th>Trial</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => (
              <tr key={code.id}>
                <td>
                  <div className="code-cell">
                    <code className="referral-code">{code.code}</code>
                    <button
                      className="copy-button"
                      onClick={() => {
                        navigator.clipboard.writeText(code.code);
                      }}
                      title="Copy code"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td>{formatDate(code.createdAt)}</td>
                <td>{code.conversions.toLocaleString()}</td>
                <td>{code.trialConversions?.toLocaleString() || 0}</td>
                <td>{code.paidConversions?.toLocaleString() || 0}</td>
                <td>
                  <span className={`status-badge ${code.status}`}>
                    {code.status}
                  </span>
                </td>
                <td>
                  <button
                    className="view-users-button"
                    onClick={() => handleViewUsers(code.code)}
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? 'Loading...' : 'View Users'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCode && (
        <UserListModal
          referralCode={selectedCode}
          users={users}
          onClose={() => {
            setSelectedCode(null);
            setUsers([]);
          }}
        />
      )}
    </div>
  );
}

