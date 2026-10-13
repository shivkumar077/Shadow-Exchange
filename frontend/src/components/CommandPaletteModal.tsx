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

export interface CommandItem {
  id: string;
  category: "Navigation" | "Actions" | "Preferences";
  title: string;
  subtitle: string;
  icon: typeof LayoutDashboard;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection: (section: string) => void;
  onOpenInstrumentPicker: () => void;
  onOpenIdentityPicker: () => void;
  onOpenPreferences: () => void;
  onOpenNotifications: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigateSection,
  onOpenInstrumentPicker,
  onOpenIdentityPicker,
  onOpenPreferences,
  onOpenNotifications,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: "nav-overview",
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
      category: "Navigation",
      title: "Go to Your Market Watchlist",
      subtitle: "Operator's custom watch queue",
      icon: Star,
      shortcut: "3",
      action: () => {
        onNavigateSection("Your Market");
        onClose();
      },
    },
    {
      id: "nav-portfolio",
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
      id: "act-instrument",
      category: "Actions",
      title: "Select Active Tradable Instrument",
      subtitle: "Open quick ticker search dialog",
      icon: Search,
      shortcut: "S",
      action: () => {
        onClose();
        onOpenInstrumentPicker();
      },
    },
    {
      id: "act-identity",
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

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

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
          <Command size={16} className="command-icon" />
          <input
            ref={inputRef}
            type="text"
            id="cmd-palette-title"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to workspace…"
            aria-label="Command search"
          />
          {query && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setQuery("")}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="command-list" role="listbox">
          {filtered.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.id}
                type="button"
                className={`command-item ${isSelected ? "is-selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="command-item-main">
                  <span className="command-item-icon">
                    <Icon size={15} />
                  </span>
                  <div>
                    <strong className="command-item-title">{cmd.title}</strong>
                    <small className="command-item-subtitle">{cmd.subtitle}</small>
                  </div>
                </div>
                <div className="command-item-meta">
                  <span className="command-item-cat">{cmd.category}</span>
                  {cmd.shortcut && <kbd className="command-shortcut">{cmd.shortcut}</kbd>}
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">No commands match “{query}”.</div>
          )}
        </div>

        <div className="command-palette-footer">
          <span>
            Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to run, <kbd>Esc</kbd> to dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
