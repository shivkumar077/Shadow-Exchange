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
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(".interactive-profile-row")) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(target as Node)) {
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
        () => onToast(`Operator ID: #${demoUserId}`)
      );
    } else {
      onToast(`Operator ID: #${demoUserId}`);
    }
    onClose();
  };

  return (
    <div className="profile-menu-popover" ref={menuRef} role="menu" aria-label="Demo operator profile menu">
      <div className="profile-menu-header">
        <div className="profile-avatar-lg" style={{ borderColor: identity.accentColor }}>
          <IdentityIcon identity={identity} size={18} />
        </div>
        <div className="profile-header-copy">
          <div className="profile-identity-name-row">
            <strong title={identity.name}>{identity.name}</strong>
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
          title="Close profile menu"
        >
          <X size={13} />
        </button>
      </div>

      <div className="profile-stats-card" aria-label="Operator financial status">
        <div className="profile-stat-row">
          <span className="profile-stat-label">OPERATOR ID</span>
          <strong
            className="profile-stat-val operator-id-val"
            title={demoUserId ? `Operator ID #${demoUserId}` : "No operator ID"}
          >
            #{demoUserId ?? "—"}
          </strong>
        </div>
        <div className="profile-stat-row">
          <span className="profile-stat-label">NET EQUITY</span>
          <strong className="profile-stat-val" title={`Net Equity: ${money(totalEquity)}`}>
            {money(totalEquity)}
          </strong>
        </div>
        <div className="profile-stat-row">
          <span className="profile-stat-label">AVAILABLE CASH</span>
          <strong className="profile-stat-val positive" title={`Available Cash: ${money(availableCash)}`}>
            {money(availableCash)}
          </strong>
        </div>
        {reservedCash > 0 && (
          <div className="profile-stat-row">
            <span className="profile-stat-label">RESERVED IN ORDERS</span>
            <span className="profile-stat-val muted-number" title={`Reserved in Orders: ${money(reservedCash)}`}>
              {money(reservedCash)}
            </span>
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
          title="Change Identity Emblem"
        >
          <Sparkles size={13} className="action-sparkle" />
          <span>Change Identity Emblem</span>
        </button>

        <button
          type="button"
          className="profile-action-btn"
          onClick={handleCopyId}
          role="menuitem"
          title="Copy Operator ID"
        >
          <Copy size={13} />
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
          title="Create New Demo Account"
        >
          <PlusCircle size={13} />
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
