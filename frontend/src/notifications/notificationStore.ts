import type { ShadowCatExpression } from "../components/ShadowCat";

export interface UserNotification {
  id: string;
  type:
    | "ORDER_SUBMITTED"
    | "ORDER_FILLED"
    | "ORDER_PARTIALLY_FILLED"
    | "ORDER_CANCELLED"
    | "ORDER_REJECTED";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  expression: ShadowCatExpression;
  orderId?: number;
  symbol?: string;
  side?: "BUY" | "SELL";
  quantity?: number;
  price?: number;
  executedQuantity?: number;
}

const STORAGE_PREFIX = "shadow_notifications_user_";
const NOTIFIED_ORDERS_PREFIX = "shadow_notified_orders_user_";

export function getNotificationsStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `${STORAGE_PREFIX}${userId}`;
  }
  return `${STORAGE_PREFIX}default`;
}

export function loadUserNotifications(userId?: number | null): UserNotification[] {
  try {
    const key = getNotificationsStorageKey(userId);
    const data = window.localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserNotifications(
  notifications: UserNotification[],
  userId?: number | null
): void {
  try {
    const key = getNotificationsStorageKey(userId);
    // Keep max 50 recent notifications
    const bounded = notifications.slice(0, 50);
    window.localStorage.setItem(key, JSON.stringify(bounded));
  } catch {
    // Non-fatal
  }
}

export function createNotification(params: {
  type: UserNotification["type"];
  title: string;
  message: string;
  expression: ShadowCatExpression;
  orderId?: number;
  symbol?: string;
  side?: "BUY" | "SELL";
  quantity?: number;
  price?: number;
  executedQuantity?: number;
}): UserNotification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    read: false,
    ...params,
  };
}

/* =========================================================================
   ORDER LIFECYCLE EVENT DEDUPLICATION
   ========================================================================= */

export function getNotifiedOrdersStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `${NOTIFIED_ORDERS_PREFIX}${userId}`;
  }
  return `${NOTIFIED_ORDERS_PREFIX}default`;
}

export function loadNotifiedOrderKeys(userId?: number | null): Set<string> {
  try {
    const key = getNotifiedOrdersStorageKey(userId);
    const data = window.localStorage.getItem(key);
    if (!data) return new Set();
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

export function hasOrderNotificationBeenSent(
  userId: number | null | undefined,
  orderId: number,
  status: string
): boolean {
  const set = loadNotifiedOrderKeys(userId);
  return set.has(`${orderId}_${status}`);
}

export function recordOrderNotificationSent(
  userId: number | null | undefined,
  orderId: number,
  status: string
): void {
  try {
    const key = getNotifiedOrdersStorageKey(userId);
    const set = loadNotifiedOrderKeys(userId);
    set.add(`${orderId}_${status}`);
    // Keep last 150 tracked keys to prevent unbounded growth
    const arr = Array.from(set).slice(-150);
    window.localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // Non-fatal
  }
}

export function formatOrderFilledMessage(
  side: string,
  symbol: string,
  quantity: number,
  price: number
): string {
  return `Your ${side} order for ${symbol} has been filled: ${quantity} shares at $${price.toFixed(2)}.`;
}

export function formatOrderPartiallyFilledMessage(
  side: string,
  symbol: string,
  quantity: number,
  price: number
): string {
  return `Your ${side} order for ${symbol} partially filled: ${quantity} shares at $${price.toFixed(2)}.`;
}
