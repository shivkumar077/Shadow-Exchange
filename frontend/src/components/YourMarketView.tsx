import { useState } from "react";
import { ArrowUpRight, Plus, Search, Star, Trash2, X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import type { StockItem } from "./InstrumentPickerModal";

interface YourMarketViewProps {
  allStocks: StockItem[];
  watchedSymbols: string[];
  onToggleWatchSymbol: (symbol: string) => void;
  favoriteSymbols?: string[];
  onToggleFavoriteSymbol?: (symbol: string) => void;
  onSelectStock: (stock: StockItem) => void;
  onNavigateToOverview: () => void;
  onOpenInstrumentPicker: () => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function Sparkline({ points, negative = false }: { points: number[]; negative?: boolean }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((p - min) / range) * 80 - 10;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg className={`sparkline ${negative ? "is-negative" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function YourMarketView({
  allStocks,
  watchedSymbols,
  onToggleWatchSymbol,
  favoriteSymbols = [],
  onToggleFavoriteSymbol,
  onSelectStock,
  onNavigateToOverview,
  onOpenInstrumentPicker,
}: YourMarketViewProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "price_desc" | "price_asc">("symbol");

  const watchedStocks = allStocks.filter((s) => watchedSymbols.includes(s.symbol));

  const filtered = watchedStocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "price_asc") return a.price - b.price;
    return a.symbol.localeCompare(b.symbol);
  });

  const validPrices = watchedStocks.filter((s) => Number.isFinite(s.price) && s.price > 0);
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices.map((s) => s.price)) : 0;
  const avgPrice = validPrices.length > 0 ? validPrices.reduce((a, s) => a + s.price, 0) / validPrices.length : 0;

  return (
    <section className="markets-view your-market-view" aria-label="Your Market Watchlist">
      <div className="markets-summary-grid">
        <article className="portfolio-metric">
          <span>WATCHED ASSETS</span>
          <strong>{watchedStocks.length.toString().padStart(2, "0")}</strong>
          <small>Curated operator watchlist</small>
        </article>
        <article className="portfolio-metric">
          <span>HIGHEST BENCHMARK</span>
          <strong>{maxPrice > 0 ? money(maxPrice) : "—"}</strong>
          <small>Peak watchlist asset</small>
        </article>
        <article className="portfolio-metric">
          <span>WATCHLIST MEAN</span>
          <strong>{avgPrice > 0 ? money(avgPrice) : "—"}</strong>
          <small>Average benchmark quote</small>
        </article>
        <article className="portfolio-metric">
          <span>UNIVERSE COVERAGE</span>
          <strong>
            {allStocks.length > 0
              ? `${Math.round((watchedStocks.length / allStocks.length) * 100)}%`
              : "0%"}
          </strong>
          <small>Fraction of exchange catalog</small>
        </article>
      </div>

      <section className="panel markets-table-panel your-market-table-panel">
        <div className="panel-topline your-market-topline">
          <div className="panel-label">
            <span className="panel-index">02</span> YOUR WATCHLIST ({sorted.length})
          </div>
          <div className="markets-controls your-market-controls">
            <label className="search-field your-market-search-field">
              <Search size={14} />
              <input
                id="your-market-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter watched stocks…"
                aria-label="Filter watched stocks"
              />
              {search && (
                <button
                  type="button"
                  className="clear-filter-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear search filter"
                >
                  <X size={11} />
                </button>
              )}
            </label>
            <div className="sort-buttons">
              <button
                type="button"
                className={`sort-pill ${sortBy === "symbol" ? "is-active" : ""}`}
                onClick={() => setSortBy("symbol")}
              >
                Symbol
              </button>
              <button
                type="button"
                className={`sort-pill ${sortBy === "price_desc" ? "is-active" : ""}`}
                onClick={() => setSortBy("price_desc")}
              >
                Price ↓
              </button>
              <button
                type="button"
                className={`sort-pill ${sortBy === "price_asc" ? "is-active" : ""}`}
                onClick={() => setSortBy("price_asc")}
              >
                Price ↑
              </button>
            </div>
            {(search !== "" || sortBy !== "symbol") && (
              <button
                type="button"
                className="subtle-button reset-filters-pill"
                onClick={() => {
                  setSearch("");
                  setSortBy("symbol");
                }}
                title="Reset search and sort filters"
              >
                <X size={11} />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              className="subtle-button add-watch-btn"
              onClick={onOpenInstrumentPicker}
              title="Add instruments to watchlist"
            >
              <Plus size={13} />
              <span>Add Stock</span>
            </button>
          </div>
        </div>

        <div className="markets-full-table your-market-full-table">
          <div className="markets-table-head your-market-table-head">
            <span>INSTRUMENT</span>
            <span>SIMULATED PRICE</span>
            <span>24H TREND</span>
            <span>STATUS</span>
            <span>ACTIONS</span>
          </div>

          {sorted.map((stock) => {
            const hasValidPrice = Number.isFinite(stock.price) && stock.price > 0;
            return (
              <div
                key={stock.id}
                className="markets-row your-market-row"
                onClick={() => {
                  onSelectStock(stock);
                  onNavigateToOverview();
                }}
              >
                <div className="table-asset your-market-asset">
                  <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
                  <div>
                    <strong>{stock.symbol}</strong>
                    <small>{stock.name}</small>
                  </div>
                </div>

                <div className="table-price-cell your-market-price-cell">
                  <strong>{hasValidPrice ? money(stock.price) : "Quote pending"}</strong>
                  <small>{hasValidPrice ? "USD" : "BENCHMARK PENDING"}</small>
                </div>

                <div className="table-spark-cell your-market-spark-cell">
                  <Sparkline points={stock.points} />
                </div>

                <div className="table-status-cell your-market-status-cell">
                  <button
                    type="button"
                    className={`star-watch-btn ${favoriteSymbols.includes(stock.symbol) ? "is-watched" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteSymbol?.(stock.symbol);
                    }}
                    title={favoriteSymbols.includes(stock.symbol) ? `Remove ${stock.symbol} from favorites` : `Mark ${stock.symbol} as favorite`}
                    aria-label={favoriteSymbols.includes(stock.symbol) ? `Remove ${stock.symbol} from favorites` : `Mark ${stock.symbol} as favorite`}
                  >
                    <Star size={11} fill={favoriteSymbols.includes(stock.symbol) ? "currentColor" : "none"} />
                    <span className="status-chip-text">{favoriteSymbols.includes(stock.symbol) ? "FAVORITE" : "WATCHED"}</span>
                  </button>
                </div>

                <div className="table-action-cell your-market-action-cell">
                  <button
                    type="button"
                    className="trade-cta-button your-market-trade-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStock(stock);
                      onNavigateToOverview();
                    }}
                  >
                    <span>Trade</span>
                    <ArrowUpRight size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-button unwatch-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchSymbol(stock.symbol);
                    }}
                    title={`Remove ${stock.symbol} from watchlist`}
                    aria-label={`Remove ${stock.symbol} from watchlist`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && watchedStocks.length > 0 && (
            <div className="empty-state your-market-search-empty">
              <p>No watched instruments match “{search}”.</p>
              <button
                type="button"
                className="subtle-button"
                onClick={() => setSearch("")}
                style={{ marginTop: "8px" }}
              >
                <X size={12} /> Clear search filter
              </button>
            </div>
          )}

          {watchedStocks.length === 0 && (
            <div className="empty-state your-market-empty-state">
              <ShadowCat expression="thinking" size={56} />
              <p>Your watchlist is currently empty.</p>
              <small>Select instruments from the exchange universe to build your custom market view.</small>
              <button
                type="button"
                className="not-found-primary-btn"
                onClick={onOpenInstrumentPicker}
                style={{ marginTop: "14px" }}
              >
                <Plus size={14} />
                <span>Add First Instrument</span>
              </button>
            </div>
          )}
        </div>

        <div className="markets-footer-note your-market-footer-note">
          <span>OPERATOR WATCHLIST PERSISTED LOCALLY · SIMULATED MARKET BENCHMARKS · CLICK ROW TO TRADE</span>
        </div>
      </section>
    </section>
  );
}
