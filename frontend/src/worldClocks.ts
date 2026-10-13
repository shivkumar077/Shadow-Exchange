export type MarketCenter = {
  id: string;
  city: string;
  exchange: string;
  timeZone: string;
};

export const MARKET_CENTERS: MarketCenter[] = [
  { id: "nyc", city: "NEW YORK", exchange: "NYSE / NASDAQ", timeZone: "America/New_York" },
  { id: "lon", city: "LONDON", exchange: "LSE", timeZone: "Europe/London" },
  { id: "bom", city: "MUMBAI / DEL", exchange: "NSE / BSE", timeZone: "Asia/Kolkata" },
  { id: "tyo", city: "TOKYO", exchange: "TSE", timeZone: "Asia/Tokyo" },
];

export type SessionStatus = "OPEN" | "LUNCH" | "CLOSED";

export function normalizeTimeZoneAbbreviation(tzName: string, timeZone: string): string {
  if (timeZone === "Asia/Kolkata") return "IST";
  if (timeZone === "Asia/Tokyo") return "JST";
  if (timeZone === "Europe/London") {
    return tzName.includes("+1") || tzName === "BST" ? "BST" : "GMT";
  }
  if (timeZone === "America/New_York") {
    return tzName.includes("-4") || tzName === "EDT" ? "EDT" : "EST";
  }
  return tzName;
}

export function getZonedTimeParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }
  const weekday = partMap.weekday ?? "";
  const hour = parseInt(partMap.hour ?? "0", 10);
  const minute = parseInt(partMap.minute ?? "0", 10);
  const second = parseInt(partMap.second ?? "0", 10);
  const rawTz = partMap.timeZoneName ?? "";
  const tzName = normalizeTimeZoneAbbreviation(rawTz, timeZone);
  const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

  return { weekday, hour, minute, second, tzName, timeString };
}

export function getMarketSessionStatus(date: Date, timeZone: string): SessionStatus {
  const { weekday, hour, minute } = getZonedTimeParts(date, timeZone);
  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
  if (!isWeekday) return "CLOSED";

  const totalMinutes = hour * 60 + minute;

  switch (timeZone) {
    case "America/New_York":
      // Mon–Fri 09:30 (570) to 16:00 (960)
      return totalMinutes >= 570 && totalMinutes < 960 ? "OPEN" : "CLOSED";

    case "Europe/London":
      // Mon–Fri 08:00 (480) to 16:30 (990)
      return totalMinutes >= 480 && totalMinutes < 990 ? "OPEN" : "CLOSED";

    case "Asia/Kolkata":
      // Mon–Fri 09:15 (555) to 15:30 (930)
      return totalMinutes >= 555 && totalMinutes < 930 ? "OPEN" : "CLOSED";

    case "Asia/Tokyo":
      // Mon–Fri Morning 09:00 (540) to 11:30 (690), Lunch 11:30 to 12:30 (750), Afternoon 12:30 to 15:30 (930)
      if (totalMinutes >= 540 && totalMinutes < 690) return "OPEN";
      if (totalMinutes >= 690 && totalMinutes < 750) return "LUNCH";
      if (totalMinutes >= 750 && totalMinutes < 930) return "OPEN";
      return "CLOSED";

    default:
      return "CLOSED";
  }
}
