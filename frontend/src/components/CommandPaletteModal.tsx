import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Command,
  LayoutDashboard,
  Search,
  Settings2,
  SlidersHorizontal,
  Star,
  User,
  Wallet,
  X,
} from "lucide-react";
import type { StockItem } from "./InstrumentPickerModal";

export interface CommandItem {
  id: string;
  type: "command" | "stock";
  category: "Navigation" | "Actions" | "Preferences" | "Instrument";
  title: string;
  subtitle: string;
  icon?: typeof LayoutDashboard;
  shortcut?: string;
  action: () => void;
  stock?: StockItem;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection: (section: string) => void;
  onOpenInstrumentPicker: () => void;
  onOpenIdentityPicker: () => void;
  onOpenPreferences: () => void;
  onOpenNotifications: () => void;
  stocks?: StockItem[];
  selectedSymbol?: string;
  onSelectStock?: (stock: StockItem) => void;
  watchedSymbols?: string[];
  onToggleWatchSymbol?: (symbol: string) => void;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigateSection,
  onOpenInstrumentPicker,
  onOpenIdentityPicker,
  onOpenPreferences,
  onOpenNotifications,
  stocks = [],
  selectedSymbol,
  onSelectStock,
  watchedSymbols = [],
  onToggleWatchSymbol,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseCommands: CommandItem[] = [
    {
      id: "nav-overview",
      type: "command",
      category: "Navigation",
      title: "Go to Overview Workspace",
      subtitle: "Main market charts, order ticket & order depth",
      icon: LayoutDashboard,
      shortcut: "1",
      action: () => {
        onNavigateSection("Overview");
        onClose();
      },
    },
    {
      id: "nav-markets",
      type: "command",
      category: "Navigation",
      title: "Go to Exchange Markets",
      subtitle: "Full 28-instrument listed catalog",
      icon: SlidersHorizontal,
      shortcut: "2",
      action: () => {
        onNavigateSection("Markets");
        onClose();
      },
    },
    {
      id: "nav-your-market",
      type: "command",
      category: "Navigation",
      title: "Go to Your Market Watchlist",
      subtitle: "Operator's custom watch queue & curated market",
      icon: Star,
      shortcut: "3",
      action: () => {
        onNavigateSection("Your Market");
        onClose();
      },
    },
    {
      id: "nav-portfolio",
      type: "command",
      category: "Navigation",
      title: "Go to Positions & Portfolio",
      subtitle: "Virtual cash balance, equity & settled shares",
      icon: Wallet,
      shortcut: "4",
      action: () => {
        onNavigateSection("Portfolio");
        onClose();
      },
    },
    {
      id: "nav-activity",
      type: "command",
      category: "Navigation",
      title: "Go to Order Activity History",
      subtitle: "Pending orders, fills, executions & cancellations",
      icon: Activity,
      shortcut: "5",
      action: () => {
        onNavigateSection("Activity");
        onClose();
      },
    },
    {
      id: "nav-about-me",
      type: "command",
      category: "Navigation",
      title: "Go to About Me & Architecture",
      subtitle: "Creator discipline, matching engine & dual-stack design",
      icon: User,
      shortcut: "A",
      action: () => {
        onNavigateSection("About Me");
        onClose();
      },
    },
    {
      id: "act-instrument",
      type: "command",
      category: "Actions",
      title: "Select Active Tradable Instrument",
      subtitle: "Open quick ticker selection dialog",
      icon: Search,
      shortcut: "S",
      action: () => {
        onClose();
        onOpenInstrumentPicker();
      },
    },
    {
      id: "act-identity",
      type: "command",
      category: "Actions",
      title: "Switch Operator Identity Emblem",
      subtitle: "Choose from 12 art-directed signature emblems",
      icon: User,
      shortcut: "I",
      action: () => {
        onClose();
        onOpenIdentityPicker();
      },
    },
    {
      id: "act-notifications",
      type: "command",
      category: "Actions",
      title: "View Operator Notifications",
      subtitle: "Lifecycle order alerts and Shadow Cat commentary",
      icon: Bell,
      shortcut: "N",
      action: () => {
        onClose();
        onOpenNotifications();
      },
    },
    {
      id: "pref-settings",
      type: "command",
      category: "Preferences",
      title: "Open Terminal Preferences",
      subtitle: "Configure default presets and personality reactions",
      icon: Settings2,
      shortcut: ",",
      action: () => {
        onClose();
        onOpenPreferences();
      },
    },
  ];

  const q = query.toLowerCase().trim();

  // Convert stocks to searchable items
  const stockItems: CommandItem[] = stocks.map((stock) => ({
    id: `stock-${stock.symbol}`,
    type: "stock",
    category: "Instrument",
    title: stock.symbol,
    subtitle: stock.name,
    stock,
    action: () => {
      if (onSelectStock) {
        onSelectStock(stock);
      }
      onClose();
    },
  }));

  // Filtering: when query is empty, show navigation + top popular instruments.
  // When query is typed, search both instruments and commands.
  let filtered: CommandItem[] = [];
  if (!q) {
    // Show base commands + top 6 stocks
    const initialStocks = stockItems.slice(0, 6);
    filtered = [...baseCommands, ...initialStocks];
  } else {
    // Match stocks first
    const matchedStocks = stockItems.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q)
    );
    // Match commands
    const matchedCommands = baseCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
    filtered = [...matchedStocks, ...matchedCommands];
  }

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop command-palette-backdrop"
      onClick={onClose}
      role="presentation"
      aria-hidden="true"
    >
      <div
        className="modal-card command-palette-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmd-palette-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-palette-search">
          <Search size={16} className="command-icon" />
          <input
            ref={inputRef}
            type="text"
            id="cmd-palette-title"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search all 28 instruments, commands, or workspaces…"
            aria-label="Search instruments and commands"
          />
          {query && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="command-list" role="listbox">
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;

            if (item.type === "stock" && item.stock) {
              const stock = item.stock;
              const isWatched = watchedSymbols.includes(stock.symbol);
              const isCurrentStock = stock.symbol === selectedSymbol;
              const hasValidPrice = Number.isFinite(stock.price) && stock.price > 0;

              return (
                <div
                  key={item.id}
                  className={`command-item command-stock-item ${isSelected ? "is-selected" : ""} ${isCurrentStock ? "is-active-stock" : ""}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="command-item-main">
                    <span className="stock-ticker-avatar">
                      {stock.symbol.slice(0, 2)}
                    </span>
                    <div className="command-stock-info">
                      <div className="command-stock-title-row">
                        <strong className="command-item-title">{stock.symbol}</strong>
                        <span className="command-stock-exchange">NASDAQ</span>
                      </div>
                      <small className="command-item-subtitle">{stock.name}</small>
                    </div>
                  </div>
                  <div className="command-item-meta">
                    <span className="command-stock-price">
                      {hasValidPrice ? money(stock.price) : "Quote pending"}
                    </span>
                    {onToggleWatchSymbol && (
                      <button
                        type="button"
                        className={`star-watch-btn icon-only ${isWatched ? "is-watched watched" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onToggleWatchSymbol(stock.symbol);
                        }}
                        title={isWatched ? `Remove ${stock.symbol} from favorites` : `Add ${stock.symbol} to favorites`}
                        aria-label={isWatched ? `Remove ${stock.symbol} from favorites` : `Add ${stock.symbol} to favorites`}
                      >
                        <Star size={12} fill={isWatched ? "currentColor" : "none"} />
                      </button>
                    )}
                    <span className="command-item-cat">STOCK</span>
                  </div>
                </div>
              );
            }

            const Icon = item.icon ?? Command;
            return (
              <button
                key={item.id}
                type="button"
                className={`command-item ${isSelected ? "is-selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="command-item-main">
                  <span className="command-item-icon">
                    <Icon size={15} />
                  </span>
                  <div>
                    <strong className="command-item-title">{item.title}</strong>
                    <small className="command-item-subtitle">{item.subtitle}</small>
                  </div>
                </div>
                <div className="command-item-meta">
                  <span className="command-item-cat">{item.category}</span>
                  {item.shortcut && <kbd className="command-shortcut">{item.shortcut}</kbd>}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">No instruments or commands match “{query}”.</div>
          )}
        </div>

        <div className="command-palette-footer">
          <span>
            Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to dismiss
          </span>
          <span className="command-palette-hint">28 INSTRUMENTS LISTED</span>
        </div>
      </div>
    </div>
  );
}
