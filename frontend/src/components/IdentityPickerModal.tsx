import { useEffect } from "react";
import { X, Check } from "lucide-react";
import {
  SIGNATURE_IDENTITIES,
  GOOGLE_AVATAR_ID,
  createGoogleIdentity,
  type SignatureIdentity,
} from "../identities";
import { IdentityIcon } from "./IdentityIcon";

interface IdentityPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIdentity: SignatureIdentity;
  onSelectIdentity: (identity: SignatureIdentity) => void;
  googleAvatarUrl?: string | null;
  googleUsername?: string | null;
}

export function IdentityPickerModal({
  isOpen,
  onClose,
  selectedIdentity,
  onSelectIdentity,
  googleAvatarUrl,
  googleUsername,
}: IdentityPickerModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasGooglePhoto = Boolean(googleAvatarUrl && googleAvatarUrl.trim().length > 0);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="modal-card identity-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">SIGNATURE IDENTITY</span>
            <h2 id="identity-picker-title">Choose Operator Emblem</h2>
          </div>
          <button
            className="icon-button modal-close-btn"
            type="button"
            aria-label="Close identity picker"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="identity-picker-intro">
          <p>
            {hasGooglePhoto
              ? "Choose your verified Google profile picture or select an original terminal emblem to represent your operator persona across sessions."
              : "Select an original terminal emblem to represent your operator persona across sessions."}
          </p>
        </div>

        <div className="identity-grid" role="listbox" aria-label="Available signature identities">
          {hasGooglePhoto && (
            <button
              type="button"
              role="option"
              aria-selected={selectedIdentity.id === GOOGLE_AVATAR_ID}
              className={`identity-card ${selectedIdentity.id === GOOGLE_AVATAR_ID ? "is-selected" : ""}`}
              onClick={() => {
                onSelectIdentity(createGoogleIdentity(googleAvatarUrl!, googleUsername));
                onClose();
              }}
            >
              <div className="identity-icon-wrap" style={{ backgroundColor: "#4285F415" }}>
                <img
                  src={googleAvatarUrl!}
                  alt={googleUsername || "Google profile picture"}
                  className="identity-google-picker-img"
                />
                {selectedIdentity.id === GOOGLE_AVATAR_ID && (
                  <span className="identity-check-badge">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </div>
              <div className="identity-card-copy">
                <div className="identity-card-title-row">
                  <strong>Google Photo</strong>
                  <span className="identity-category-pill google-pill">GOOGLE</span>
                </div>
                <small>{googleUsername ? `Photo from ${googleUsername}` : "Verified Google photo"}</small>
              </div>
            </button>
          )}

          {SIGNATURE_IDENTITIES.map((identity) => {
            const isSelected = identity.id === selectedIdentity.id;
            return (
              <button
                key={identity.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`identity-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => {
                  onSelectIdentity(identity);
                  onClose();
                }}
              >
                <div className="identity-icon-wrap" style={{ backgroundColor: `${identity.accentColor}15` }}>
                  <IdentityIcon identity={identity} size={34} />
                  {isSelected && (
                    <span className="identity-check-badge">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="identity-card-copy">
                  <div className="identity-card-title-row">
                    <strong>{identity.name}</strong>
                    <span className="identity-category-pill">{identity.category}</span>
                  </div>
                  <small>{identity.tagline}</small>
                </div>
              </button>
            );
          })}
        </div>

        <div className="modal-footer">
          <span>
            {hasGooglePhoto
              ? `GOOGLE PROFILE PHOTO + ${SIGNATURE_IDENTITIES.length} SIGNATURE EMBLEMS · PERSISTED PER OPERATOR`
              : `${SIGNATURE_IDENTITIES.length} SIGNATURE EMBLEMS · LOCALLY PERSISTED PER DEMO OPERATOR`}
          </span>
        </div>
      </div>
    </div>
  );
}
