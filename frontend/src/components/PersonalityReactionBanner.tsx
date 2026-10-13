import { useEffect } from "react";
import { X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import type { PersonalityReaction } from "../personality/personalitySystem";

interface PersonalityReactionBannerProps {
  reaction: PersonalityReaction | null;
  onDismiss: () => void;
}

export function PersonalityReactionBanner({
  reaction,
  onDismiss,
}: PersonalityReactionBannerProps) {
  useEffect(() => {
    if (!reaction) return;
    // Auto-dismiss after 6 seconds for low/medium priority, 9 seconds for high
    const duration = reaction.priority === "high" ? 9000 : 6000;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [reaction, onDismiss]);

  if (!reaction) return null;

  return (
    <aside
      className={`personality-reaction-banner is-priority-${reaction.priority}`}
      role="status"
      aria-live="polite"
    >
      <div className="reaction-mascot-slot">
        <ShadowCat expression={reaction.expression} size={36} />
      </div>
      <div className="reaction-content">
        <div className="reaction-eyebrow">
          <span>SHADOW CAT SAYS</span>
        </div>
        <p className="reaction-message">{reaction.message}</p>
      </div>
      <button
        type="button"
        className="reaction-close-btn"
        onClick={onDismiss}
        aria-label="Dismiss cat reaction"
      >
        <X size={14} />
      </button>
    </aside>
  );
}
