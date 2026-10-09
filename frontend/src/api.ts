export type ApiStock = {
  id: number;
  symbol: string;
  companyName: string;
  currentPrice: number | string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export async function getStocks(): Promise<ApiStock[]> {
  const response = await fetch(`${API_BASE_URL}/api/stocks`);

  if (!response.ok) {
    throw new Error(`Exchange API returned ${response.status}. Make sure the Spring Boot backend is running.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The exchange API returned an unexpected stock-list response.");
  }

  return data as ApiStock[];
}
