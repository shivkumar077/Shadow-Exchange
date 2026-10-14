export type ApiStock = {
  id: number;
  symbol: string;
  companyName: string;
  currentPrice: number | string;
};

export type ApiUser = {
  id: number;
  username: string;
  email: string;
  balance: number | string;
  reservedBalance: number | string;
};

export type ApiHolding = {
  id: number;
  stockId: number;
  symbol: string;
  companyName: string;
  currentPrice: number | string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  marketValue: number | string;
};

export type ApiOrder = {
  id: number;
  userId: number;
  stockId: number;
  type: "BUY" | "SELL";
  price: number | string;
  quantity: number;
  status: "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";
  createdAt?: string;
};

export type AuthStatus = {
  authenticated: boolean;
  id?: number;
  username?: string;
  email?: string;
  avatarUrl?: string;
  authProvider?: "LOCAL_DEMO" | "GOOGLE";
  isDemo?: boolean;
  balance?: number | string;
  reservedBalance?: number | string;
};

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (typeof envUrl === "string") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  if (import.meta.env?.DEV) {
    return "http://localhost:8080";
  }
  return "";
}

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return `Exchange API returned ${response.status}.`;

  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      if (typeof record.message === "string") return record.message;
      if (typeof record.error === "string") return record.error;
    }
  } catch {
    // Some backend errors are plain text rather than JSON.
  }

  return body.length > 220 ? body.slice(0, 220) : body;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const isMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) || {}),
  };

  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (isMutating) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-XSRF-TOKEN"] = csrfToken;
    }
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return request<AuthStatus>("/api/auth/me");
}

export async function logout(): Promise<void> {
  await request<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getGoogleLoginUrl(): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/oauth2/authorization/google`;
}

export async function getStocks(): Promise<ApiStock[]> {
  const data: unknown = await request("/api/stocks");
  if (!Array.isArray(data)) {
    throw new Error("The exchange API returned an unexpected stock-list response.");
  }
  return data as ApiStock[];
}

export async function getUser(userId: number): Promise<ApiUser> {
  return request<ApiUser>(`/api/users/${userId}`);
}

export async function createDemoUser(): Promise<ApiUser> {
  return request<ApiUser>("/api/users/demo", {
    method: "POST",
    body: JSON.stringify({
      username: "Shadow Demo Operator",
      email: `shadow-demo-${crypto.randomUUID()}@example.test`,
      password: crypto.randomUUID(),
    }),
  });
}

export async function getPortfolio(userId: number): Promise<ApiHolding[]> {
  return request<ApiHolding[]>(`/api/users/${userId}/portfolio`);
}

export async function getOrders(userId: number): Promise<ApiOrder[]> {
  return request<ApiOrder[]>(`/orders/user/${userId}`);
}

export async function cancelOrder(orderId: number): Promise<void> {
  await request<void>(`/orders/${orderId}`, { method: "DELETE" });
}

export async function submitOrder(order: {
  userId: number;
  stockId: number;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
}): Promise<ApiOrder> {
  return request<ApiOrder>("/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export type ApiOrderBook = {
  stockId: number;
  bids: ApiOrder[];
  asks: ApiOrder[];
};

export async function getOrderBook(stockId: number): Promise<ApiOrderBook> {
  return request<ApiOrderBook>(`/orders/book/${stockId}`);
}

export type PublicTradeResponse = {
  tradeId: number;
  stockId: number;
  symbol: string;
  price: number;
  quantity: number;
  executedAt: string;
};

export function resolveWebSocketUrl(apiBase?: string, explicitWs?: string): string {
  if (typeof explicitWs === "string" && explicitWs.trim().length > 0) {
    return explicitWs.trim();
  }

  const rawBase = typeof apiBase === "string" ? apiBase.trim() : "";
  if (rawBase.length > 0) {
    try {
      const url = new URL(rawBase.startsWith("http") ? rawBase : `http://${rawBase}`);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${url.host}/ws`;
    } catch {
      return "ws://localhost:8080/ws";
    }
  }

  // Automatic production resolution when running on Vercel
  if (typeof window !== "undefined" && window.location?.hostname?.includes("vercel.app")) {
    return "wss://shadow-exchange-1.onrender.com/ws";
  }

  return "ws://localhost:8080/ws";
}

export function getWebSocketUrl(): string {
  return resolveWebSocketUrl(
    import.meta.env?.VITE_API_BASE_URL,
    import.meta.env?.VITE_WS_URL
  );
}

export function validatePublicTrade(data: unknown): PublicTradeResponse | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  const tradeId = Number(record.tradeId);
  const stockId = Number(record.stockId);
  const symbol = typeof record.symbol === "string" ? record.symbol.trim() : "";
  const price = Number(record.price);
  const quantity = Number(record.quantity);
  const executedAt = typeof record.executedAt === "string" ? record.executedAt.trim() : "";

  if (
    !Number.isFinite(tradeId) ||
    tradeId <= 0 ||
    !Number.isFinite(stockId) ||
    stockId <= 0 ||
    symbol.length === 0 ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    executedAt.length === 0
  ) {
    return null;
  }

  return {
    tradeId,
    stockId,
    symbol,
    price,
    quantity,
    executedAt,
  };
}

export type LocalOrder = {
  id: number;
  stockId: number;
  side: "BUY" | "SELL";
  symbol: string;
  quantity: number;
  price: number;
  status: "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";
  time: string;
};

export function mapApiOrders(
  savedOrders: ApiOrder[],
  stocks?: { id: number; symbol: string }[],
  limit: number = 100
): LocalOrder[] {
  return savedOrders.slice(0, limit).map((savedOrder) => {
    const matchedStock = stocks?.find((stock) => stock.id === savedOrder.stockId);
    return {
      id: savedOrder.id,
      stockId: savedOrder.stockId,
      side: savedOrder.type,
      symbol: matchedStock ? matchedStock.symbol : `#${savedOrder.stockId}`,
      quantity: savedOrder.quantity,
      price: Number(savedOrder.price),
      status: savedOrder.status,
      time: savedOrder.createdAt
        ? new Date(savedOrder.createdAt).toLocaleTimeString("en-GB", { hour12: false })
        : "—",
    };
  });
}

export function computeSellableShares(
  holding?: Pick<ApiHolding, "quantity" | "reservedQuantity" | "availableQuantity"> | null
): number {
  if (!holding) return 0;
  if (typeof holding.availableQuantity === "number") {
    return Math.max(0, holding.availableQuantity);
  }
  const qty = Number(holding.quantity) || 0;
  const reserved = Number(holding.reservedQuantity) || 0;
  return Math.max(0, qty - reserved);
}

export function isSellableStock(
  stock: { id: number; symbol: string },
  holdings: ApiHolding[] = []
): boolean {
  const holding = holdings.find((h) => h.stockId === stock.id || h.symbol === stock.symbol);
  return computeSellableShares(holding) > 0;
}
