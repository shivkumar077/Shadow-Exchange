import { useEffect, useRef } from "react";
import { Copy, PlusCircle, Shield, Sparkles, X } from "lucide-react";
import type { ApiUser } from "../api";
import type { SignatureIdentity } from "../identities";
import { IdentityIcon } from "./IdentityIcon";

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  account: ApiUser | null;
  demoUserId: number | null;
  identity: SignatureIdentity;
  availableCash: number;
  reservedCash: number;
  totalEquity: number;
  onOpenIdentityPicker: () => void;
  onSwitchNewDemoUser: () => void;
  onToast: (msg: string) => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function ProfileMenu({
  isOpen,
  onClose,
  account,
  demoUserId,
  identity,
  availableCash,
  reservedCash,
  totalEquity,
  onOpenIdentityPicker,
  onSwitchNewDemoUser,
  onToast,
}: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (!demoUserId) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(demoUserId)).then(
        () => onToast(`Operator ID #${demoUserId} copied to clipboard.`),
        () => onToast(`Operator ID: ${demoUserId}`)
      );
    } else {
      onToast(`Operator ID: ${demoUserId}`);
    }
    onClose();
  };

  return (
    <div className="profile-menu-popover" ref={menuRef} role="menu" aria-label="Demo operator profile menu">
      <div className="profile-menu-header">
        <div className="profile-avatar-lg" style={{ borderColor: identity.accentColor }}>
          <IdentityIcon identity={identity} size={20} />
        </div>
        <div className="profile-header-copy">
          <div className="profile-identity-name-row">
            <strong>{identity.name}</strong>
            <span className="profile-persona-tag">PERSONA</span>
          </div>
          <small title={account?.email ?? `operator-${demoUserId ?? "none"}@shadow.test`}>
            {account?.email ?? `operator-${demoUserId ?? "none"}@shadow.test`}
          </small>
        </div>
        <button
          type="button"
          className="icon-button profile-close-btn"
          onClick={onClose}
          aria-label="Close profile menu"
        >
          <X size={14} />
        </button>
      </div>

      <div className="profile-stats-card">
        <div className="profile-stat-row">
          <span>OPERATOR ID</span>
          <strong>#{demoUserId ?? "—"}</strong>
        </div>
        <div className="profile-stat-row">
          <span>NET EQUITY</span>
          <strong>{money(totalEquity)}</strong>
        </div>
        <div className="profile-stat-row">
          <span>AVAILABLE CASH</span>
          <strong className="positive">{money(availableCash)}</strong>
        </div>
        {reservedCash > 0 && (
          <div className="profile-stat-row">
            <span>RESERVED IN ORDERS</span>
            <span className="muted-number">{money(reservedCash)}</span>
          </div>
        )}
      </div>

      <div className="profile-menu-actions">
        <button
          type="button"
          className="profile-action-btn identity-action-btn"
          onClick={() => {
            onClose();
            onOpenIdentityPicker();
          }}
          role="menuitem"
        >
          <Sparkles size={14} className="action-sparkle" />
          <span>Change Identity Emblem</span>
        </button>

        <button
          type="button"
          className="profile-action-btn"
          onClick={handleCopyId}
          role="menuitem"
        >
          <Copy size={14} />
          <span>Copy Operator ID</span>
        </button>

        <button
          type="button"
          className="profile-action-btn"
          onClick={() => {
            onClose();
            onSwitchNewDemoUser();
          }}
          role="menuitem"
        >
          <PlusCircle size={14} />
          <span>Create New Demo Account</span>
        </button>
      </div>

      <div className="profile-menu-footer">
        <Shield size={12} />
        <span>SIMULATED OPERATOR SESSION</span>
      </div>
    </div>
  );
}
