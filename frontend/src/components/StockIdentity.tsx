import type { CSSProperties } from "react";

export interface StockIdentityProps {
  symbol: string;
  name: string;
  avatarChar?: string;
  showAvatar?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Shared Stock Identity Component for Shadow Exchange.
 * Guarantees consistent separation and visual hierarchy between ticker symbols
 * and company names across tables, search results, pickers, and market views.
 */
export function StockIdentity({
  symbol,
  name,
  avatarChar,
  showAvatar = true,
  className = "",
  style,
}: StockIdentityProps) {
  const char = avatarChar || symbol.slice(0, 1).toUpperCase();

  return (
    <div className={`stock-identity ${className}`} style={style}>
      {showAvatar && (
        <span className="ticker-avatar" aria-hidden="true">
          {char}
        </span>
      )}
      <div className="stock-identity-info">
        <strong className="stock-identity-symbol">{symbol}</strong>
        <span className="stock-identity-name" title={name}>
          {name}
        </span>
      </div>
    </div>
  );
}
