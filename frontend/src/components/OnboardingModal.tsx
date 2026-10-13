import { useEffect } from "react";
import { ArrowRight, Terminal, X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
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
      className="modal-backdrop onboarding-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="modal-card onboarding-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="icon-button modal-close-btn onboarding-close-btn"
          onClick={onClose}
          aria-label="Close welcome modal"
          title="Close welcome modal"
        >
          <X size={16} />
        </button>

        <div className="onboarding-mascot-hero">
          <ShadowCat expression="thinking" size={72} />
        </div>

        <div className="onboarding-header">
          <h2 className="onboarding-title" id="onboarding-title">
            Welcome to Shadow Exchange
          </h2>
          <p className="onboarding-subtitle">
            You are financially imaginary
          </p>
        </div>

        <div className="onboarding-body">
          <p className="onboarding-lead">
            Your account has been provisioned with simulated capital and starter allocations across 28 real listed instruments.
          </p>
          <p className="onboarding-disclaimer">
            None of it is real money. All of the consequences are educational.
          </p>

          <div className="onboarding-features-list">
            <div className="feature-item">
              <span className="feature-dot" />
              <div>
                <strong>Real Order-Book Matching</strong>
                <small>Bids and asks match strictly through deterministic price-time priority.</small>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <div>
                <strong>28-Instrument Universe</strong>
                <small>Tradable US equities across tech, finance, pharma, and energy.</small>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              <div>
                <strong>The Shadow Cat Mascot</strong>
                <small>A deadpan companion providing commentary on your executions.</small>
              </div>
            </div>
          </div>
        </div>

        <div className="onboarding-footer">
          <button
            type="button"
            className="not-found-primary-btn onboarding-cta-btn"
            onClick={onClose}
          >
            <Terminal size={15} />
            <span>Enter the Shadows</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
