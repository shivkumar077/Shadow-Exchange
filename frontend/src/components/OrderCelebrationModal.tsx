import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { ShadowCat } from "./ShadowCat";

export interface CelebrationOrderDetails {
  orderId: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
}

interface OrderCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CelebrationOrderDetails | null;
  reduceMotion?: boolean;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function OrderCelebrationModal({
  isOpen,
  onClose,
  order,
  reduceMotion = false,
}: OrderCelebrationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const totalValue = order.quantity * order.price;

  return (
    <div
      className={`modal-backdrop celebration-backdrop ${reduceMotion ? "reduced-motion" : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-card celebration-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button celebration-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close celebration"
        >
          <X size={16} />
        </button>

        {/* Ambient sparkle stars */}
        <div className="celebration-sparkles-container" aria-hidden="true">
          <Sparkles className="sparkle-item sparkle-1" size={16} />
          <Sparkles className="sparkle-item sparkle-2" size={14} />
          <Sparkles className="sparkle-item sparkle-3" size={18} />
        </div>

        <div className="celebration-mascot-wrapper">
          <ShadowCat expression="profit" size={72} />
        </div>

        <div className="celebration-header">
          <span className="celebration-eyebrow">SHADOW CAT EXTREME</span>
          <h2 id="celebration-title">YOU HAVE BEEN BLESSED.<br /><em>ORDER FULFILLED.</em></h2>
        </div>

        <div className="celebration-ticket">
          <div className="ticket-col">
            <span>ACTION</span>
            <strong className={`celebration-side-badge ${order.side.toLowerCase()}`}>
              {order.side}
            </strong>
          </div>
          <div className="ticket-col">
            <span>INSTRUMENT</span>
            <strong className="celebration-symbol">{order.symbol}</strong>
          </div>
          <div className="ticket-col">
            <span>EXECUTED</span>
            <strong>{order.quantity} shares</strong>
          </div>
          <div className="ticket-col">
            <span>PRICE</span>
            <strong>{money(order.price)}</strong>
          </div>
          <div className="ticket-col">
            <span>TOTAL VALUE</span>
            <strong className="celebration-value">{money(totalValue)}</strong>
          </div>
        </div>

        <p className="celebration-caption">
          The order book has bowed to your offering. Execution completed on the simulated exchange.
        </p>

        <button
          type="button"
          className="celebration-action-btn"
          onClick={onClose}
        >
          <span>Continue Trading</span>
        </button>
      </div>
    </div>
  );
}
