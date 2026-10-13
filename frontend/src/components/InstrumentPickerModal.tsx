import { useEffect, useRef, useState } from "react";
import { Lock, Search, X } from "lucide-react";
import { computeSellableShares, isSellableStock, type ApiHolding } from "../api";

export type StockItem = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  points: number[];
};

interface InstrumentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: StockItem[];
  selectedSymbol: string;
  onSelect: (stock: StockItem) => void;
  mode?: "BUY" | "SELL";
  holdings?: ApiHolding[];
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatPrice = (value: number) =>
  value > 0 ? money(value) : "Quote pending";

export function InstrumentPickerModal({
  isOpen,
  onClose,
  stocks,
  selectedSymbol,
  onSelect,
  mode = "BUY",
  holdings = [],
}: InstrumentPickerModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      // Focus input on mount/open
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = stocks.filter(
    (s) =>
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="modal-card instrument-picker-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instrument-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">
              {mode === "SELL" ? "SELECT SELL INSTRUMENT" : "SELECT INSTRUMENT"}
            </span>
            <h2 id="instrument-picker-title">
              {mode === "SELL" ? "Sellable Holdings & Instruments" : "Exchange Instruments"}
            </h2>
          </div>
          <button
            className="icon-button modal-close-btn"
            type="button"
            aria-label="Close instrument picker"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-search-bar">
          <Search size={15} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol or company name…"
            aria-label="Search instruments"
          />
          {query && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="picker-instrument-list" role="listbox">
          {filtered.map((stock) => {
            const isSelected = stock.symbol === selectedSymbol;
            const holding = holdings.find(
              (h) => h.stockId === stock.id || h.symbol === stock.symbol
            );
            const availableShares = computeSellableShares(holding);
            const isSellDisabled = mode === "SELL" && availableShares <= 0;

            return (
              <button
                key={stock.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-disabled={isSellDisabled}
                disabled={isSellDisabled}
                className={`picker-row ${isSelected ? "is-selected" : ""} ${isSellDisabled ? "is-disabled is-locked" : ""} ${mode === "SELL" && availableShares > 0 ? "has-shares" : ""}`}
                onClick={() => {
                  if (isSellDisabled) return;
                  onSelect(stock);
                  onClose();
                }}
              >
                <div className="picker-row-main">
                  <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
                  <div className="picker-copy">
                    <div className="picker-copy-header">
                      <strong>{stock.symbol}</strong>
                      {mode === "SELL" ? (
                        isSellDisabled ? (
                          <span className="shares-badge zero-shares">
                            <Lock size={9} /> 0 shares available
                          </span>
                        ) : (
                          <span className="shares-badge available-shares">
                            {availableShares} {availableShares === 1 ? "share" : "shares"} available
                          </span>
                        )
                      ) : (
                        availableShares > 0 && (
                          <span className="shares-badge holding-shares">
                            {availableShares} owned
                          </span>
                        )
                      )}
                    </div>
                    <small>{stock.name}</small>
                  </div>
                </div>
                <div className="picker-price-block">
                  <span className="picker-price">{formatPrice(stock.price)}</span>
                  {isSelected && <span className="selected-badge">ACTIVE</span>}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state">
              No instruments match “{query}”.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span>
            {mode === "SELL"
              ? `${stocks.length} INSTRUMENTS · ${stocks.filter((s) => isSellableStock(s, holdings)).length} WITH AVAILABLE SHARES`
              : `${stocks.length} INSTRUMENTS AVAILABLE · SIMULATED MARKET`}
          </span>
        </div>
      </div>
    </div>
  );
}
