import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

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
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function InstrumentPickerModal({
  isOpen,
  onClose,
  stocks,
  selectedSymbol,
  onSelect,
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
            <span className="modal-eyebrow">SELECT INSTRUMENT</span>
            <h2 id="instrument-picker-title">Exchange Instruments</h2>
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
            return (
              <button
                key={stock.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`picker-row ${isSelected ? "is-selected" : ""}`}
                onClick={() => {
                  onSelect(stock);
                  onClose();
                }}
              >
                <div className="picker-row-main">
                  <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
                  <div className="picker-copy">
                    <strong>{stock.symbol}</strong>
                    <small>{stock.name}</small>
                  </div>
                </div>
                <div className="picker-price-block">
                  <span className="picker-price">{money(stock.price)}</span>
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
          <span>{stocks.length} INSTRUMENTS AVAILABLE · SIMULATED MARKET</span>
        </div>
      </div>
    </div>
  );
}
