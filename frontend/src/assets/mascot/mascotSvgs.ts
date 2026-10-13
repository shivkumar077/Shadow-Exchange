import type { ShadowCatExpression } from "../../components/ShadowCat";

export const MASCOT_EXPRESSIONS: Record<ShadowCatExpression, {
  name: string;
  description: string;
  defaultCaption: string;
}> = {
  neutral: {
    name: "Neutral Observer",
    description: "Deadpan, half-lidded glowing lime-green eyes. The silent mascot of dark liquidity pools.",
    defaultCaption: "The market has been notified.",
  },
  blessed: {
    name: "Blessed Execution",
    description: "Curved happy lime eyes with an ethereal glowing halo and trade sparkle.",
    defaultCaption: "You have been blessed. Your order has been fulfilled.",
  },
  suspicious: {
    name: "Suspicious Audit",
    description: "One eye narrowed, one raised eyebrow. Unconvinced by lowball bids.",
    defaultCaption: "Ambitious offer. The market remains unconvinced.",
  },
  broke: {
    name: "Broke Speculator",
    description: "Flat deadpan gaze with an icy sweatdrop and empty pockets.",
    defaultCaption: "Damn. You're a cheapskate.",
  },
  profit: {
    name: "Temporary Genius",
    description: "Neon profit shades and upward trend reflection.",
    defaultCaption: "Look at you. Temporary genius.",
  },
  loss: {
    name: "Stoic Drawdown",
    description: "Downward ember tick and hardened resilience.",
    defaultCaption: "Rough day? At least you're gaining experience.",
  },
  sleepy: {
    name: "Off-Hours Idle",
    description: "Curled resting eyes with floating neon Zs during quiet market hours.",
    defaultCaption: "Connecting to exchange & loading instruments…",
  },
  facepalm: {
    name: "Market Facepalm",
    description: "Paw over eye in deadpan disbelief.",
    defaultCaption: "The exchange has reviewed your request and chosen violence.",
  },
  thinking: {
    name: "Prudent Analyst",
    description: "Paw on chin, upward gaze, calculating risk.",
    defaultCaption: "Congratulations. You're now responsible for your own decisions.",
  },
  404: {
    name: "Lost Signal",
    description: "Crossed glitch pupils and searching radar waves outside the exchange perimeter.",
    defaultCaption: "Looks like this little cat lost the signal.",
  },
};
