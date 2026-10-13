import type { ShadowCatExpression } from "../components/ShadowCat";

export type PersonalityEvent =
  | "ORDER_SUBMITTED"
  | "ORDER_FILLED"
  | "ORDER_PARTIALLY_FILLED"
  | "ORDER_REJECTED"
  | "INSUFFICIENT_FUNDS"
  | "PROFIT_MILESTONE"
  | "DRAWDOWN"
  | "ORDER_CANCELLED"
  | "LOWBALL_OFFER"
  | "FIRST_TRADE"
  | "LOST_ROUTE"
  | "FAVORITE_ADDED"
  | "FAVORITE_REMOVED"
  | "ONBOARDING_COMPLETED";

export type PersonalityMode = "minimal" | "full" | "deadpan" | "extreme" | "muted";

export interface PersonalityReaction {
  id: string;
  event: PersonalityEvent;
  expression: ShadowCatExpression;
  message: string;
  priority: "high" | "medium" | "low";
  timestamp: number;
}

export const REACTION_DEFINITIONS: Record<
  PersonalityEvent,
  { expression: ShadowCatExpression; message: string; priority: "high" | "medium" | "low" }
> = {
  ORDER_SUBMITTED: {
    expression: "neutral",
    message: "Your order is on its way. The market has been notified.",
    priority: "low",
  },
  ORDER_FILLED: {
    expression: "blessed",
    message: "You have been blessed. Your order has been fulfilled.",
    priority: "medium",
  },
  ORDER_PARTIALLY_FILLED: {
    expression: "thinking",
    message: "One paw in the market. Order partially filled.",
    priority: "medium",
  },
  ORDER_REJECTED: {
    expression: "suspicious",
    message: "The exchange has reviewed your request and chosen violence.",
    priority: "high",
  },
  INSUFFICIENT_FUNDS: {
    expression: "broke",
    message: "Damn. You're a cheapskate.",
    priority: "high",
  },
  PROFIT_MILESTONE: {
    expression: "profit",
    message: "Look at you. Temporary genius.",
    priority: "medium",
  },
  DRAWDOWN: {
    expression: "loss",
    message: "Rough day? At least you're gaining experience.",
    priority: "low",
  },
  ORDER_CANCELLED: {
    expression: "neutral",
    message: "A mutual decision. No hard feelings.",
    priority: "low",
  },
  LOWBALL_OFFER: {
    expression: "suspicious",
    message: "Ambitious offer. The market remains unconvinced.",
    priority: "low",
  },
  FIRST_TRADE: {
    expression: "thinking",
    message: "Congratulations. You're now responsible for your own decisions.",
    priority: "medium",
  },
  LOST_ROUTE: {
    expression: "404",
    message: "Looks like this little cat lost the signal.",
    priority: "high",
  },
  FAVORITE_ADDED: {
    expression: "blessed",
    message: "Added to your personal radar. We are watching.",
    priority: "low",
  },
  FAVORITE_REMOVED: {
    expression: "neutral",
    message: "Purged from watchlist. Moving on.",
    priority: "low",
  },
  ONBOARDING_COMPLETED: {
    expression: "blessed",
    message: "The terminal is yours. Try not to break anything.",
    priority: "medium",
  },
};

export const EXTREME_REACTION_MESSAGES: Partial<Record<PersonalityEvent, string>> = {
  ORDER_SUBMITTED: "The cat has acknowledged your offering.",
  ORDER_FILLED: "YOU HAVE BEEN BLESSED. ORDER FULFILLED.",
  ORDER_PARTIALLY_FILLED: "One paw in the market.",
  ORDER_CANCELLED: "Retreat was always an option.",
  INSUFFICIENT_FUNDS: "Empty pockets detected. The cat judges your liquidity.",
  LOWBALL_OFFER: "Audacious lowball. The book remains unconvinced.",
  FAVORITE_ADDED: "Added to radar. The cat's watchful eye expands.",
  FAVORITE_REMOVED: "Purged from watchlist. Unceremoniously discarded.",
  ONBOARDING_COMPLETED: "Onboarding complete. Try not to embarrass the firm.",
};

export function shouldShowReaction(
  priority: "high" | "medium" | "low",
  mode: PersonalityMode = "full"
): boolean {
  if (mode === "muted") return false;
  if (mode === "minimal") return priority === "high";
  if (mode === "deadpan") return priority === "high" || priority === "medium";
  return true;
}

export function createReaction(
  event: PersonalityEvent,
  overrideMessage?: string,
  mode: PersonalityMode = "full"
): PersonalityReaction {
  const def = REACTION_DEFINITIONS[event] ?? {
    expression: "neutral",
    message: "The market observes in silence.",
    priority: "low",
  };

  let message = overrideMessage || def.message;
  if (!overrideMessage && mode === "extreme" && EXTREME_REACTION_MESSAGES[event]) {
    message = EXTREME_REACTION_MESSAGES[event]!;
  }

  return {
    id: `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    event,
    expression: def.expression,
    message,
    priority: def.priority,
    timestamp: Date.now(),
  };
}
