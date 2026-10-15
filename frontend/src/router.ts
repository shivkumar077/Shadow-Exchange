export interface RouteInfo {
  isNotFound: boolean;
  section: string;
}

export const VALID_APPLICATION_ROUTES: Record<string, string> = {
  "/": "Overview",
  "/index.html": "Overview",
  "/overview": "Overview",
  "/markets": "Markets",
  "/your-market": "Your Market",
  "/watchlist": "Your Market",
  "/portfolio": "Portfolio",
  "/activity": "Activity",
  "/about": "About Me",
  "/about-me": "About Me",
  "/suto": "Suto",
};

export function isSutoRoute(pathname: string): boolean {
  return normalizePath(pathname) === "/suto";
}

export function normalizePath(pathname: string): string {
  if (!pathname || pathname.trim() === "") return "/";
  const trimmed = pathname.trim();
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Strip trailing slashes unless root
  if (withLeading.length > 1 && withLeading.endsWith("/")) {
    return withLeading.slice(0, -1).toLowerCase();
  }
  return withLeading.toLowerCase();
}

export function isKnownAppPath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return Object.prototype.hasOwnProperty.call(VALID_APPLICATION_ROUTES, normalized);
}

export function getRouteInfo(pathname: string): RouteInfo {
  const normalized = normalizePath(pathname);
  if (isKnownAppPath(normalized)) {
    return {
      isNotFound: false,
      section: VALID_APPLICATION_ROUTES[normalized] ?? "Overview",
    };
  }
  return {
    isNotFound: true,
    section: "Overview",
  };
}

export function navigateTo(path: string): void {
  try {
    if (typeof window !== "undefined" && window.history?.pushState) {
      window.history.pushState({}, "", path);
      // Dispatch a popstate or custom event so listeners react
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  } catch {
    // Fallback if window is restricted
  }
}
