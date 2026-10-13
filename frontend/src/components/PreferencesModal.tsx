import { useEffect } from "react";
import { Volume2, TableProperties, Hash, X } from "lucide-react";

export interface TerminalPreferences {
  soundEnabled: boolean;
  density: "comfortable" | "compact";
  defaultQuantity: number;
}

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: TerminalPreferences;
  onUpdatePreferences: (updated: Partial<TerminalPreferences>) => void;
}

export function PreferencesModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}: PreferencesModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="modal-card preferences-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferences-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">SETTINGS &amp; WORKSPACE</span>
            <h2 id="preferences-title">Terminal Preferences</h2>
          </div>
          <button
            className="icon-button modal-close-btn"
            type="button"
            aria-label="Close preferences"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="preferences-body">
          <div className="pref-section">
            <div className="pref-info">
              <div className="pref-icon">
                <Volume2 size={16} />
              </div>
              <div>
                <strong>Audio Feedback</strong>
                <p>Audible tick on live market prints and order executions.</p>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => onUpdatePreferences({ soundEnabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="pref-section">
            <div className="pref-info">
              <div className="pref-icon">
                <TableProperties size={16} />
              </div>
              <div>
                <strong>Table Display Density</strong>
                <p>Adjust padding and row height across watchlist and depth tables.</p>
              </div>
            </div>
            <div className="segmented-switch" role="radiogroup" aria-label="Table density">
              <button
                type="button"
                className={preferences.density === "comfortable" ? "is-active" : ""}
                onClick={() => onUpdatePreferences({ density: "comfortable" })}
              >
                Comfortable
              </button>
              <button
                type="button"
                className={preferences.density === "compact" ? "is-active" : ""}
                onClick={() => onUpdatePreferences({ density: "compact" })}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="pref-section">
            <div className="pref-info">
              <div className="pref-icon">
                <Hash size={16} />
              </div>
              <div>
                <strong>Default Order Quantity</strong>
                <p>Initial share quantity when switching between instruments.</p>
              </div>
            </div>
            <div className="segmented-switch" role="radiogroup" aria-label="Default order quantity">
              {[1, 5, 10, 25, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  className={preferences.defaultQuantity === qty ? "is-active" : ""}
                  onClick={() => onUpdatePreferences({ defaultQuantity: qty })}
                >
                  {qty}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <span>SETTINGS PERSISTED TO BROWSER LOCAL STORAGE · TAKES EFFECT IMMEDIATELY</span>
        </div>
      </div>
    </div>
  );
}
