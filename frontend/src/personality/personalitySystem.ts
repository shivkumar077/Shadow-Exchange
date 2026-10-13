import type { ShadowCatExpression } from "../components/ShadowCat";

export type PersonalityEvent =
  | "ORDER_SUBMITTED"
  | "ORDER_FILLED"
  | "ORDER_REJECTED"
  | "INSUFFICIENT_FUNDS"
  | "PROFIT_MILESTONE"
  | "DRAWDOWN"
  | "ORDER_CANCELLED"
  | "LOWBALL_OFFER"
  | "FIRST_TRADE"
  | "LOST_ROUTE";

export type PersonalityMode = "full" | "minimal" | "muted";

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
};

export function shouldShowReaction(
  priority: "high" | "medium" | "low",
  mode: PersonalityMode = "full"
): boolean {
  if (mode === "muted") return false;
  if (mode === "minimal") return priority === "high";
  return true;
}

export function createReaction(
  event: PersonalityEvent,
  overrideMessage?: string
): PersonalityReaction {
  const def = REACTION_DEFINITIONS[event];
  return {
    id: `reaction_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    event,
    expression: def.expression,
    message: overrideMessage || def.message,
    priority: def.priority,
    timestamp: Date.now(),
  };
}
