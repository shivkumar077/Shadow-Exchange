export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt?: number;
}

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  {
    id: "first_order",
    title: "First Step into Shadows",
    description: "Submitted your first limit order to the matching engine.",
    iconName: "Send",
  },
  {
    id: "first_fill",
    title: "Blessed Execution",
    description: "Successfully executed and filled a trade order.",
    iconName: "CheckCircle",
  },
  {
    id: "first_cancellation",
    title: "Strategic Retreat",
    description: "Cancelled an open order before execution.",
    iconName: "Undo",
  },
  {
    id: "portfolio_explorer",
    title: "Broad Horizon",
    description: "Traded across multiple distinct market sectors.",
    iconName: "Compass",
  },
];

const ACHIEVEMENTS_PREFIX = "shadow_achievements_user_";

export function getAchievementsStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `${ACHIEVEMENTS_PREFIX}${userId}`;
  }
  return `${ACHIEVEMENTS_PREFIX}default`;
}

export function loadUserAchievements(userId?: number | null): Record<string, number> {
  try {
    const key = getAchievementsStorageKey(userId);
    const data = window.localStorage.getItem(key);
    if (!data) return {};
    return JSON.parse(data) || {};
  } catch {
    return {};
  }
}

export function unlockAchievement(
  achievementId: string,
  userId?: number | null
): Achievement | null {
  try {
    const unlocked = loadUserAchievements(userId);
    if (unlocked[achievementId]) return null; // already unlocked

    unlocked[achievementId] = Date.now();
    const key = getAchievementsStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(unlocked));

    const found = ACHIEVEMENTS_CATALOG.find((a) => a.id === achievementId);
    return found ? { ...found, unlockedAt: unlocked[achievementId] } : null;
  } catch {
    return null;
  }
}
