export type ChartTimeframe = "1D" | "1W" | "1M" | "1Y";

export interface ChartTimeframeData {
  timeframe: ChartTimeframe;
  xLabels: string[];
  points: number[]; // Scaled 15..92 for SVG viewbox y-coordinate rendering
  rawPrices: number[]; // Dollar prices matching the reference scale
  periodOpen: number;
  periodHigh: number;
  periodLow: number;
  periodClose: number;
  change: number;
  changePercent: number;
}

export const TIMEFRAME_LABELS: Record<ChartTimeframe, string[]> = {
  "1D": ["09:30", "11:00", "12:30", "14:00", "15:30", "NOW"],
  "1W": ["MON", "TUE", "WED", "THU", "FRI", "NOW"],
  "1M": ["4W AGO", "3W AGO", "2W AGO", "1W AGO", "NOW"],
  "1Y": ["Q1", "Q2", "Q3", "Q4", "NOW"],
};

/**
 * Deterministic hash combining ticker string, timeframe, and fixed seed.
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generates stable, deterministic synthetic historical price series for any instrument and timeframe.
 * Guarantees that periodOpen, periodClose, periodHigh, periodLow, change, and changePercent agree.
 */
export function getChartHistory(
  symbol: string,
  timeframe: ChartTimeframe = "1D",
  referencePrice = 150.0
): ChartTimeframeData {
  const upper = (symbol || "NVDA").trim().toUpperCase();
  const basePrice = Number.isFinite(referencePrice) && referencePrice > 0 ? referencePrice : 150.0;
  const seed = hashString(`${upper}_${timeframe}_shadow_v2`);

  // Timeframe point count and volatility scale
  let pointCount = 25;
  let volatility = 0.025; // 2.5% intraday
  let drift = 0.005;

  switch (timeframe) {
    case "1D":
      pointCount = 25;
      volatility = 0.015;
      drift = (seed % 100 - 45) / 2500;
      break;
    case "1W":
      pointCount = 28;
      volatility = 0.035;
      drift = (seed % 100 - 48) / 1200;
      break;
    case "1M":
      pointCount = 30;
      volatility = 0.065;
      drift = (seed % 100 - 50) / 800;
      break;
    case "1Y":
      pointCount = 36;
      volatility = 0.14;
      drift = (seed % 100 - 50) / 400;
      break;
  }

  const rawPrices: number[] = [];
  let currentPrice = basePrice * (1 - drift * (pointCount / 2));

  for (let i = 0; i < pointCount; i++) {
    const stepSeed = hashString(`${seed}_step_${i}`);
    const noise = ((stepSeed % 1000) / 500 - 1.0) * volatility * basePrice;
    currentPrice = Math.max(1.0, currentPrice + noise + drift * basePrice);
    rawPrices.push(Number(currentPrice.toFixed(2)));
  }

  // Anchor the final point close to the reference price for continuity
  rawPrices[rawPrices.length - 1] = basePrice;

  const periodOpen = rawPrices[0];
  const periodClose = rawPrices[rawPrices.length - 1];
  const periodHigh = Math.max(...rawPrices);
  const periodLow = Math.min(...rawPrices);
  const change = Number((periodClose - periodOpen).toFixed(2));
  const changePercent = Number(((change / periodOpen) * 100).toFixed(2));

  // Map raw prices to 15..90 vertical coordinate space for SVG chart
  const priceRange = periodHigh - periodLow || 1.0;
  const points = rawPrices.map((p) => {
    const normalized = (p - periodLow) / priceRange;
    return Number((20 + normalized * 68).toFixed(1));
  });

  return {
    timeframe,
    xLabels: TIMEFRAME_LABELS[timeframe],
    points,
    rawPrices,
    periodOpen,
    periodHigh,
    periodLow,
    periodClose,
    change,
    changePercent,
  };
}
