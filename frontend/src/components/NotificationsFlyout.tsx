import { useEffect, useRef } from "react";
import { CheckCheck, Trash2, X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import type { UserNotification } from "../notifications/notificationStore";

interface NotificationsFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDismissNotification: (id: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationsFlyout({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onDismissNotification,
}: NotificationsFlyoutProps) {
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="modal-backdrop notifications-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        ref={flyoutRef}
        className="notifications-flyout-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notif-header">
          <div>
            <span className="modal-eyebrow">OPERATOR ALERTS</span>
            <h2 id="notif-title">
              Notifications {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </h2>
          </div>
          <div className="notif-actions">
            {notifications.length > 0 && (
              <>
                <button
                  type="button"
                  className="icon-text-btn"
                  onClick={onMarkAllAsRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span>Read all</span>
                </button>
                <button
                  type="button"
                  className="icon-text-btn"
                  onClick={onClearAll}
                  title="Clear all notifications"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              </>
            )}
            <button
              type="button"
              className="icon-button modal-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="notif-list" role="list">
          {notifications.map((notif) => (
            <article
              key={notif.id}
              className={`notif-item ${notif.read ? "is-read" : "is-unread"}`}
              role="listitem"
            >
              <div className="notif-avatar">
                <ShadowCat expression={notif.expression} size={30} />
              </div>
              <div className="notif-body">
                <div className="notif-item-topline">
                  <strong className="notif-item-title">{notif.title}</strong>
                  <span className="notif-time">{formatRelativeTime(notif.timestamp)}</span>
                </div>
                <p className="notif-item-message">{notif.message}</p>
              </div>
              <button
                type="button"
                className="notif-dismiss-btn"
                onClick={() => onDismissNotification(notif.id)}
                aria-label="Dismiss notification"
              >
                <X size={12} />
              </button>
            </article>
          ))}

          {notifications.length === 0 && (
            <div className="notif-empty-state">
              <ShadowCat expression="sleepy" size={48} />
              <p>No trade notifications yet.</p>
              <small>The market is quiet and the cat is sleeping.</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
