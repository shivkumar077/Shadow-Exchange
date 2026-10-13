import { useEffect } from "react";
import { Volume2, TableProperties, Hash, Sparkles, Eye, Zap, ShieldAlert, X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import type { PersonalityMode } from "../personality/personalitySystem";

export interface TerminalPreferences {
  soundEnabled: boolean;
  density: "comfortable" | "compact";
  defaultQuantity: number;
  personalityMode: PersonalityMode;
  extremeCursorTrack?: boolean;
  extremeAmbientAnim?: boolean;
  extremeCelebrations?: boolean;
  reduceMotion?: boolean;
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

          <div className="pref-section">
            <div className="pref-info">
              <div className="pref-icon">
                <ShadowCat expression="neutral" size={18} />
              </div>
              <div>
                <strong>Shadow Cat Personality</strong>
                <p>Mascot commentary mode on trades and market events.</p>
              </div>
            </div>
            <div className="segmented-switch" role="radiogroup" aria-label="Personality mode">
              <button
                type="button"
                className={preferences.personalityMode === "minimal" ? "is-active" : ""}
                onClick={() => onUpdatePreferences({ personalityMode: "minimal" })}
                title="Critical alerts only"
              >
                Minimal
              </button>
              <button
                type="button"
                className={preferences.personalityMode === "full" ? "is-active" : ""}
                onClick={() => onUpdatePreferences({ personalityMode: "full" })}
                title="Balanced commentary on orders and market milestones"
              >
                Full
              </button>
              <button
                type="button"
                className={preferences.personalityMode === "deadpan" ? "is-active" : ""}
                onClick={() => onUpdatePreferences({ personalityMode: "deadpan" })}
                title="Wry, deadpan remarks with low expressiveness"
              >
                Deadpan
              </button>
              <button
                type="button"
                className={preferences.personalityMode === "extreme" ? "is-active extreme-pill" : "extreme-pill"}
                onClick={() => onUpdatePreferences({ personalityMode: "extreme" })}
                title="Opt-in high energy mode with interactive cat, celebrations, and commentary"
              >
                Extreme
              </button>
            </div>
          </div>

          {/* Extreme Mode Sub-Controls (Opt-In Features) */}
          {preferences.personalityMode === "extreme" && (
            <div className="extreme-subcontrols-panel">
              <div className="subcontrols-header">
                <Sparkles size={13} className="subcontrols-sparkle" />
                <span>EXTREME MODE BEHAVIORS &amp; ACCESSIBILITY</span>
              </div>

              <div className="subcontrol-row">
                <div className="subcontrol-label">
                  <Eye size={13} />
                  <div>
                    <strong>Cursor Tracking Eyes</strong>
                    <small>Cat's eyes follow pointer movement on desktop.</small>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.extremeCursorTrack !== false}
                    onChange={(e) =>
                      onUpdatePreferences({ extremeCursorTrack: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="subcontrol-row">
                <div className="subcontrol-label">
                  <Zap size={13} />
                  <div>
                    <strong>Ambient Animations</strong>
                    <small>Occasional idle blinking and micro-movements.</small>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.extremeAmbientAnim !== false}
                    onChange={(e) =>
                      onUpdatePreferences({ extremeAmbientAnim: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="subcontrol-row">
                <div className="subcontrol-label">
                  <Sparkles size={13} />
                  <div>
                    <strong>Celebration Overlay</strong>
                    <small>Festive announcement overlay on fully executed orders.</small>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferences.extremeCelebrations !== false}
                    onChange={(e) =>
                      onUpdatePreferences({ extremeCelebrations: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div className="subcontrol-row">
                <div className="subcontrol-label">
                  <ShieldAlert size={13} />
                  <div>
                    <strong>Reduce Motion</strong>
                    <small>Disable decorative motion and celebration confetti.</small>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(preferences.reduceMotion)}
                    onChange={(e) =>
                      onUpdatePreferences({ reduceMotion: e.target.checked })
                    }
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span>SETTINGS PERSISTED TO BROWSER LOCAL STORAGE · TAKES EFFECT IMMEDIATELY</span>
        </div>
      </div>
    </div>
  );
}
