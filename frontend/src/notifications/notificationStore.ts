import type { ShadowCatExpression } from "../components/ShadowCat";

export interface UserNotification {
  id: string;
  type: "ORDER_SUBMITTED" | "ORDER_FILLED" | "ORDER_CANCELLED" | "ORDER_REJECTED";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  expression: ShadowCatExpression;
  orderId?: number;
  symbol?: string;
}

const STORAGE_PREFIX = "shadow_notifications_user_";

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
}): UserNotification {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    read: false,
    ...params,
  };
}
