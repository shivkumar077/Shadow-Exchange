import { useEffect, useState } from "react";
import {
  MARKET_CENTERS,
  getZonedTimeParts,
  getMarketSessionStatus,
  type MarketCenter,
  type SessionStatus,
} from "../worldClocks";

export { MARKET_CENTERS, getZonedTimeParts, getMarketSessionStatus, type MarketCenter, type SessionStatus };

export function WorldClocks() {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section className="world-clocks-bar" aria-label="Global Financial Centers Live Clocks">
      <div className="world-clocks-grid">
        {MARKET_CENTERS.map((center) => {
          const { timeString, tzName } = getZonedTimeParts(currentDate, center.timeZone);
          const status = getMarketSessionStatus(currentDate, center.timeZone);

          return (
            <div key={center.id} className="clock-card" data-market={center.id}>
              <div className="clock-header">
                <span className="clock-city">{center.city}</span>
                <span className="clock-exchange">{center.exchange}</span>
              </div>
              <div className="clock-time-row">
                <span className="clock-digits">{timeString}</span>
                <span className="clock-tz">{tzName}</span>
              </div>
              <div className="clock-status-row">
                <span
                  className={`status-light ${
                    status === "OPEN" ? "" : status === "LUNCH" ? "is-warning" : "is-closed"
                  }`}
                />
                <span className="clock-session-text">
                  {status === "OPEN"
                    ? "SESSION OPEN"
                    : status === "LUNCH"
                    ? "LUNCH BREAK"
                    : "SESSION CLOSED"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="clocks-footnote">
        <span>REGULAR TRADING HOURS · INDICATIVE SESSION STATUS (EXCLUDES LOCAL HOLIDAYS)</span>
      </div>
    </section>
  );
}
