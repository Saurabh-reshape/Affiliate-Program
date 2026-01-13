import { useEffect, useRef, useState } from "react";
import type { User } from "../types";

interface HeaderProps {
  user: User;
  onLogout?: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutButtonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showLogoutConfirm) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        logoutButtonRef.current &&
        !logoutButtonRef.current.contains(target)
      ) {
        setShowLogoutConfirm(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showLogoutConfirm]);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    onLogout?.();
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <div className="flex items-center">
            <img src="/Logo.png" alt="Reshape" className="h-8 object-contain" />
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            {user.avatar && (
              <img src={user.avatar} alt={user.name} className="user-avatar" />
            )}
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
            </div>
            {onLogout && (
              <div className="logout-action">
                <button
                  type="button"
                  className="logout-button"
                  onClick={() => setShowLogoutConfirm((open) => !open)}
                  title="Sign out"
                  ref={logoutButtonRef}
                  aria-expanded={showLogoutConfirm}
                  aria-haspopup="dialog"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Logout</span>
                </button>

                {showLogoutConfirm && (
                  <div className="logout-confirm-overlay" role="presentation">
                    <div
                      className="logout-confirm-modal"
                      role="dialog"
                      aria-label="Confirm logout"
                      aria-modal="true"
                      ref={popoverRef}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="logout-confirm-header">
                        <div className="logout-confirm-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <circle cx="12" cy="16" r="0.5"></circle>
                          </svg>
                        </div>
                        <div className="logout-confirm-body">
                          <div className="logout-confirm-title">Logout?</div>
                          <div className="logout-confirm-text">
                            You will be logged out of your dashboard.
                          </div>
                        </div>
                      </div>
                      <div className="logout-confirm-actions">
                        <button
                          type="button"
                          className="logout-cancel"
                          onClick={() => setShowLogoutConfirm(false)}
                        >
                          Stay
                        </button>
                        <button
                          type="button"
                          className="logout-confirm"
                          onClick={handleLogoutConfirm}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
