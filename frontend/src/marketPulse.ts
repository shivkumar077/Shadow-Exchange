export interface MarketIndexIndicator {
  id: string;
  name: string;
  currentValue: number;
  formattedValue: string;
  changePoints: number;
  changePercent: number;
  isPositive: boolean;
  sparkline: number[];
  lastUpdated: string;
}

const INDICES_CONFIG = [
  { id: "sp500", name: "S&P 500", base: 5840.5, volatility: 0.0035 },
  { id: "nasdaq", name: "NASDAQ", base: 18270.0, volatility: 0.0055 },
  { id: "dow", name: "DOW JONES", base: 42120.0, volatility: 0.0025 },
  { id: "russell", name: "RUSSELL 2000", base: 2210.0, volatility: 0.0045 },
];

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Returns dynamic, reproducible market index indicators updated on a 30-minute cadence.
 * Refreshes within the same 30-minute window produce identical values.
 */
export function getMarketPulseIndicators(currentTimeMs: number = Date.now()): MarketIndexIndicator[] {
  // 30-minute cadence interval key
  const bucketKey = Math.floor(currentTimeMs / (30 * 60 * 1000));
  const dateObj = new Date(bucketKey * 30 * 60 * 1000);
  const timeStr = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return INDICES_CONFIG.map((cfg) => {
    const seed = hashString(`${cfg.id}_${bucketKey}`);
    const noise = ((seed % 1000) / 500 - 0.98) * cfg.volatility;
    const current = Number((cfg.base * (1 + noise)).toFixed(2));
    const openValue = cfg.base;
    const changePoints = Number((current - openValue).toFixed(2));
    const changePercent = Number(((changePoints / openValue) * 100).toFixed(2));
    const isPositive = changePoints >= 0;

    // Generate 12 deterministic intraday sparkline points
    const sparkline: number[] = [];
    let prev = 40;
    for (let i = 0; i < 12; i++) {
      const stepSeed = hashString(`${seed}_spark_${i}`);
      const delta = (stepSeed % 15) - 7;
      prev = Math.max(15, Math.min(85, prev + delta));
      sparkline.push(prev);
    }
    // Final point reflects positive or negative
    sparkline[sparkline.length - 1] = isPositive ? 75 : 25;

    return {
      id: cfg.id,
      name: cfg.name,
      currentValue: current,
      formattedValue: current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      changePoints,
      changePercent,
      isPositive,
      sparkline,
      lastUpdated: timeStr,
    };
  });
}
