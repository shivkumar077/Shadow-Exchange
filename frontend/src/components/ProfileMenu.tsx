import { useEffect, useRef, useState } from "react";
import { Copy, LogOut, PlusCircle, Shield, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ApiUser, AuthStatus } from "../api";
import type { SignatureIdentity } from "../identities";
import { IdentityIcon } from "./IdentityIcon";

export interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  account: ApiUser | null;
  authStatus?: AuthStatus | null;
  demoUserId: number | null;
  identity: SignatureIdentity;
  availableCash: number;
  reservedCash: number;
  totalEquity: number;
  onOpenIdentityPicker: () => void;
  onSwitchNewDemoUser: () => void;
  onGoogleSignIn?: () => void;
  onLogout?: () => void;
  onToast: (msg: string) => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function GoogleGLogo({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="google-icon-svg">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function ProfileMenu({
  isOpen,
  onClose,
  account,
  authStatus,
  demoUserId,
  identity,
  availableCash,
  reservedCash,
  totalEquity,
  onOpenIdentityPicker,
  onSwitchNewDemoUser,
  onGoogleSignIn,
  onLogout,
  onToast,
}: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [avatarError, setAvatarError] = useState(false);

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

  const isGoogle = Boolean(authStatus?.authenticated && authStatus.authProvider === "GOOGLE");
  const displayName = isGoogle && authStatus?.username ? authStatus.username : identity.name;
  const displayEmail = authStatus?.email || account?.email || `operator-${demoUserId ?? "none"}@shadow.test`;

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
    <div
      className="profile-menu-popover"
      ref={menuRef}
      role="menu"
      aria-label={isGoogle ? "Authenticated Google operator profile menu" : "Demo operator profile menu"}
    >
      <div className="profile-menu-header">
        <div
          className="profile-avatar-lg"
          style={{ borderColor: isGoogle ? "var(--signal)" : identity.accentColor }}
        >
          {identity.imageUrl && !avatarError ? (
            <img
              src={identity.imageUrl}
              alt={displayName}
              className="profile-google-avatar-img"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <IdentityIcon identity={identity} size={18} />
          )}
        </div>
        <div className="profile-header-copy">
          <div className="profile-identity-name-row">
            <strong title={displayName}>{displayName}</strong>
            <span className={`profile-persona-tag ${isGoogle ? "is-google" : ""}`}>
              {isGoogle ? "GOOGLE OPERATOR" : "PERSONA"}
            </span>
          </div>
          <small title={displayEmail}>{displayEmail}</small>
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
        {isGoogle ? (
          <button
            type="button"
            className="profile-action-btn logout-action-btn"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
            role="menuitem"
            title="Sign out of Google session"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            className="profile-action-btn google-signin-btn"
            onClick={() => {
              onClose();
              onGoogleSignIn?.();
            }}
            role="menuitem"
            title="Continue with Google"
          >
            <GoogleGLogo size={14} />
            <span>Continue with Google</span>
          </button>
        )}

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

        {!isGoogle && (
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
        )}
      </div>

      <div className="profile-menu-footer">
        {isGoogle ? (
          <>
            <ShieldCheck size={12} className="shield-verified" />
            <span>GOOGLE OIDC VERIFIED SESSION</span>
          </>
        ) : (
          <>
            <Shield size={12} />
            <span>SIMULATED OPERATOR SESSION</span>
          </>
        )}
      </div>
    </div>
  );
}
