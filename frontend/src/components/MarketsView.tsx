import { useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import type { StockItem } from "./InstrumentPickerModal";

interface MarketsViewProps {
  stocks: StockItem[];
  stocksLoading: boolean;
  stocksError: string;
  selectedSymbol: string;
  onSelectStock: (stock: StockItem) => void;
  onNavigateToOverview: () => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function Sparkline({ points, negative = false }: { points: number[]; negative?: boolean }) {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${(index / (points.length - 1)) * 100} ${100 - point}`).join(" ");
  return (
    <svg className={`sparkline ${negative ? "is-negative" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MarketsView({
  stocks,
  stocksLoading,
  stocksError,
  selectedSymbol,
  onSelectStock,
  onNavigateToOverview,
}: MarketsViewProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"symbol" | "price_desc" | "price_asc">("symbol");

  const filtered = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "price_asc") return a.price - b.price;
    return a.symbol.localeCompare(b.symbol);
  });

  const maxPrice = stocks.length > 0 ? Math.max(...stocks.map((s) => s.price)) : 0;
  const minPrice = stocks.length > 0 ? Math.min(...stocks.map((s) => s.price)) : 0;
  const avgPrice = stocks.length > 0 ? stocks.reduce((acc, s) => acc + s.price, 0) / stocks.length : 0;

  return (
    <section className="markets-view">
      <div className="markets-summary-grid">
        <article className="portfolio-metric">
          <span>ACTIVE INSTRUMENTS</span>
          <strong>{stocks.length.toString().padStart(2, "0")}</strong>
          <small>Persisted exchange stocks</small>
        </article>
        <article className="portfolio-metric">
          <span>HIGHEST LISTED</span>
          <strong>{money(maxPrice)}</strong>
          <small>Peak benchmark asset</small>
        </article>
        <article className="portfolio-metric">
          <span>LOWEST LISTED</span>
          <strong>{money(minPrice)}</strong>
          <small>Entry liquidity instrument</small>
        </article>
        <article className="portfolio-metric">
          <span>AVERAGE BENCHMARK</span>
          <strong>{money(avgPrice)}</strong>
          <small>Listed universe arithmetic mean</small>
        </article>
      </div>

      <section className="panel markets-table-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">01</span> ALL LISTED INSTRUMENTS ({sorted.length})
          </div>
          <div className="markets-controls">
            <label className="search-field">
              <Search size={14} />
              <input
                id="markets-view-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by ticker or name…"
                aria-label="Filter markets"
              />
              {search && (
                <button
                  type="button"
                  className="clear-filter-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear filter"
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
          </div>
        </div>

        <div className="markets-full-table">
          <div className="markets-table-head">
            <span>INSTRUMENT</span>
            <span>CURRENT PRICE</span>
            <span>SIMULATED SPREAD</span>
            <span>PRICE TREND</span>
            <span>ACTION</span>
          </div>

          {sorted.map((stock) => {
            const isSelected = stock.symbol === selectedSymbol;
            return (
              <div
                key={stock.id}
                className={`markets-row ${isSelected ? "is-active-row" : ""}`}
                onClick={() => {
                  onSelectStock(stock);
                  onNavigateToOverview();
                }}
              >
                <div className="table-asset">
                  <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
                  <div>
                    <strong>{stock.symbol}</strong>
                    <small>{stock.name}</small>
                  </div>
                </div>

                <div className="table-price-cell">
                  <strong>{money(stock.price)}</strong>
                  <small>USD</small>
                </div>

                <div className="table-spread-cell">
                  <span>~0.05%</span>
                  <small>EST. SPREAD</small>
                </div>

                <div className="table-spark-cell">
                  <Sparkline points={stock.points} />
                </div>

                <div className="table-action-cell">
                  <button
                    type="button"
                    className="trade-cta-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStock(stock);
                      onNavigateToOverview();
                    }}
                  >
                    <span>Trade</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {stocksLoading && <div className="empty-state">Loading exchange instruments…</div>}
          {stocksError && <div className="empty-state is-error">{stocksError}</div>}
          {!stocksLoading && !stocksError && sorted.length === 0 && (
            <div className="empty-state">No instruments match “{search}”.</div>
          )}
        </div>

        <div className="markets-footer-note">
          <span>CLICK ANY ROW TO LOAD DIRECTLY INTO TERMINAL ORDER TICKET · DELAYED ILLUSTRATIVE SPREADS</span>
        </div>
      </section>
    </section>
  );
}
