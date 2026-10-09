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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
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
