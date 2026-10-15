export interface SignatureIdentity {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  category: "creature" | "celestial" | "insignia" | "google";
  svgPath: string; // ViewBox 0 0 32 32 SVG inner markup
  imageUrl?: string;
}

export const GOOGLE_AVATAR_ID = "google-avatar";

export function createGoogleIdentity(avatarUrl: string, username?: string | null): SignatureIdentity {
  return {
    id: GOOGLE_AVATAR_ID,
    name: username ? `${username} (Google)` : "Google Profile Photo",
    tagline: "Verified Google Account photo",
    accentColor: "#4285F4",
    category: "google",
    svgPath: "",
    imageUrl: avatarUrl,
  };
}

export const SIGNATURE_IDENTITIES: SignatureIdentity[] = [
  {
    id: "shadow-cat",
    name: "Shadow Cat",
    tagline: "Silent observer of dark liquidity pools",
    accentColor: "#d3f17b",
    category: "creature",
    svgPath: `
      <path d="M7 6 L12 13 L20 13 L25 6 L24 16 C24 22 20 26 16 26 C12 26 8 22 8 16 Z" fill="currentColor" fill-opacity="0.85" />
      <circle cx="12" cy="17" r="1.6" fill="#11130f" />
      <circle cx="20" cy="17" r="1.6" fill="#11130f" />
      <path d="M15 20 L16 21.5 L17 20 Z" fill="#11130f" />
      <path d="M10 21 L6 20 M10 22 L6 23 M22 21 L26 20 M22 22 L26 23" stroke="#11130f" stroke-width="0.8" stroke-linecap="round" />
    `,
  },
  {
    id: "midnight-fox",
    name: "Midnight Fox",
    tagline: "Agile navigator of spread inefficiencies",
    accentColor: "#f19c65",
    category: "creature",
    svgPath: `
      <polygon points="6,7 13,15 8,19" fill="currentColor" fill-opacity="0.85" />
      <polygon points="26,7 19,15 24,19" fill="currentColor" fill-opacity="0.85" />
      <polygon points="10,14 22,14 16,26" fill="currentColor" fill-opacity="0.95" />
      <polygon points="13,17 19,17 16,24" fill="#11130f" />
      <circle cx="13" cy="16" r="1.3" fill="currentColor" />
      <circle cx="19" cy="16" r="1.3" fill="currentColor" />
      <circle cx="16" cy="24" r="1" fill="#11130f" />
    `,
  },
  {
    id: "little-raven",
    name: "Little Raven",
    tagline: "Harbinger of early price discovery",
    accentColor: "#9d8df1",
    category: "creature",
    svgPath: `
      <path d="M16 6 C12 6 9 9 9 14 C9 20 12 26 18 26 C21 26 24 23 24 19 C24 13 21 6 16 6 Z" fill="currentColor" fill-opacity="0.85" />
      <polygon points="7,14 11,12 11,16" fill="currentColor" />
      <circle cx="13" cy="12" r="1.5" fill="#11130f" />
      <path d="M14 19 L19 14 M13 22 L20 17" stroke="#11130f" stroke-width="1.2" stroke-linecap="round" />
    `,
  },
  {
    id: "orbital-planet",
    name: "Orbital Planet",
    tagline: "Gravitational anchor of centralized order flow",
    accentColor: "#7be0f1",
    category: "celestial",
    svgPath: `
      <circle cx="16" cy="16" r="6.5" fill="currentColor" fill-opacity="0.85" />
      <ellipse cx="16" cy="16" rx="12" ry="3.5" fill="none" stroke="currentColor" stroke-width="1.6" transform="rotate(-25 16 16)" />
      <circle cx="21" cy="9" r="1" fill="currentColor" />
    `,
  },
  {
    id: "crescent-moon",
    name: "Crescent Moon",
    tagline: "Vigilant guardian of the overnight session",
    accentColor: "#f1e37b",
    category: "celestial",
    svgPath: `
      <path d="M21 7 C14 8 10 13 10 19 C10 24 13 27 18 28 C11 27 7 21 7 15 C7 9 12 6 21 7 Z" fill="currentColor" fill-opacity="0.9" />
      <polygon points="23,12 24,14 26,14 24.5,15.5 25,17.5 23,16 21,17.5 21.5,15.5 20,14 22,14" fill="currentColor" transform="scale(0.7) translate(8, 4)" />
    `,
  },
  {
    id: "comet",
    name: "Comet",
    tagline: "High-velocity momentum execution",
    accentColor: "#7bf1b8",
    category: "celestial",
    svgPath: `
      <circle cx="22" cy="10" r="4.5" fill="currentColor" fill-opacity="0.9" />
      <path d="M18 12 L7 23 M17 9 L5 19 M21 15 L11 25" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.75" />
      <circle cx="6" cy="24" r="0.8" fill="currentColor" />
    `,
  },
  {
    id: "neon-crest",
    name: "Neon Crest",
    tagline: "Cryptographic exchange heraldry",
    accentColor: "#d3f17b",
    category: "insignia",
    svgPath: `
      <polygon points="16,5 26,10 26,20 16,27 6,20 6,10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <polygon points="16,10 22,13 22,18 16,22 10,18 10,13" fill="currentColor" fill-opacity="0.85" />
      <circle cx="16" cy="16" r="1.5" fill="#11130f" />
    `,
  },
  {
    id: "exchange-insignia",
    name: "Exchange Insignia",
    tagline: "The foundational three-bar Shadow mark",
    accentColor: "#d3f17b",
    category: "insignia",
    svgPath: `
      <g transform="skewX(-16) translate(4, 3)">
        <rect x="6" y="11" width="3.5" height="11" rx="1" fill="currentColor" fill-opacity="0.6" />
        <rect x="11.5" y="5" width="3.5" height="17" rx="1" fill="currentColor" fill-opacity="0.95" />
        <rect x="17" y="8" width="3.5" height="14" rx="1" fill="currentColor" fill-opacity="0.8" />
      </g>
    `,
  },
  {
    id: "cyber-hawk",
    name: "Cyber Hawk",
    tagline: "Predatory precision on microsecond spikes",
    accentColor: "#65b5f1",
    category: "creature",
    svgPath: `
      <path d="M8 12 C10 8 16 7 21 8 C25 9 27 12 25 15 L28 17 L22 18 C20 22 16 24 11 24 L14 18 C10 18 8 15 8 12 Z" fill="currentColor" fill-opacity="0.9" />
      <circle cx="19" cy="12" r="1.5" fill="#11130f" />
    `,
  },
  {
    id: "solitary-wolf",
    name: "Solitary Wolf",
    tagline: "Patient hunter of resting limit orders",
    accentColor: "#a6b19a",
    category: "creature",
    svgPath: `
      <path d="M9 25 L10 18 L13 14 L11 8 L16 11 L22 7 L21 13 L25 17 L21 21 L16 25 Z" fill="currentColor" fill-opacity="0.85" />
      <circle cx="15" cy="13" r="1.4" fill="#11130f" />
    `,
  },
  {
    id: "quantum-prism",
    name: "Quantum Prism",
    tagline: "Dispersion of cross-market liquidity signals",
    accentColor: "#e67bf1",
    category: "insignia",
    svgPath: `
      <polygon points="16,6 26,24 6,24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <polygon points="16,11 22,21 10,21" fill="currentColor" fill-opacity="0.8" />
      <line x1="16" y1="6" x2="16" y2="24" stroke="#11130f" stroke-width="1" />
    `,
  },
  {
    id: "iron-bull",
    name: "Iron Bull",
    tagline: "Resilient bedrock of perpetual liquidity",
    accentColor: "#f17c70",
    category: "creature",
    svgPath: `
      <path d="M7 8 C9 13 12 14 12 18 L10 24 L16 25 L22 24 L20 18 C20 14 23 13 25 8 C20 9 18 13 16 13 C14 13 12 9 7 8 Z" fill="currentColor" fill-opacity="0.9" />
      <circle cx="13" cy="17" r="1.2" fill="#11130f" />
      <circle cx="19" cy="17" r="1.2" fill="#11130f" />
    `,
  },
];

export const DEFAULT_IDENTITY_ID = "shadow-cat";

export function getIdentity(id?: string | null): SignatureIdentity {
  if (!id) return SIGNATURE_IDENTITIES[0];
  const found = SIGNATURE_IDENTITIES.find((item) => item.id === id);
  return found ?? SIGNATURE_IDENTITIES[0];
}

export function getDefaultIdentity(): SignatureIdentity {
  return SIGNATURE_IDENTITIES[0];
}

/**
 * Storage namespace boundary:
 * Identities are stored locally per demo user ID under "shadow_identity_user_{userId}".
 * If userId is not provided, falls back to "shadow_identity_default".
 * This strictly prevents one demo account's identity choice from overwriting another's.
 */
export function getStorageKey(userId?: number | null): string {
  if (userId && Number.isFinite(userId) && userId > 0) {
    return `shadow_identity_user_${userId}`;
  }
  return "shadow_identity_default";
}

export function assignRandomIdentityForUser(userId: number): SignatureIdentity {
  const key = getStorageKey(userId);
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      return getIdentity(existing);
    }
    const randomIndex = Math.floor(Math.random() * SIGNATURE_IDENTITIES.length);
    const chosen = SIGNATURE_IDENTITIES[randomIndex];
    saveStoredIdentity(chosen.id, userId);
    return chosen;
  } catch {
    return getDefaultIdentity();
  }
}

export function getStoredIdentity(
  userId?: number | null,
  googleAvatarUrl?: string | null,
  googleUsername?: string | null
): SignatureIdentity {
  try {
    const key = getStorageKey(userId);
    const stored = window.localStorage.getItem(key);
    if (stored === GOOGLE_AVATAR_ID) {
      if (googleAvatarUrl) {
        return createGoogleIdentity(googleAvatarUrl, googleUsername);
      }
      return getDefaultIdentity();
    }
    if (stored) {
      return getIdentity(stored);
    }
    if (googleAvatarUrl) {
      return createGoogleIdentity(googleAvatarUrl, googleUsername);
    }
    return getDefaultIdentity();
  } catch {
    return getDefaultIdentity();
  }
}

export function saveStoredIdentity(identityId: string, userId?: number | null): void {
  try {
    const key = getStorageKey(userId);
    window.localStorage.setItem(key, identityId);
  } catch {
    // Non-fatal if localStorage is restricted
  }
}
