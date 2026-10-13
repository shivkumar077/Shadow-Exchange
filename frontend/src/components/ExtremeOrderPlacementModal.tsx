import { useEffect } from "react";
import { Sparkles, X, Clock, CheckCircle2 } from "lucide-react";
import { ShadowCat } from "./ShadowCat";
import {
  getExtremeOrderDialogue,
  formatExtremeStatusLabel,
} from "../extremeOrderPlacement";

export interface PlacementOrderDetails {
  orderId: number;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: string; // e.g. "PENDING", "PARTIALLY_FILLED", "FILLED"
  dialogueIndex?: number;
}

interface ExtremeOrderPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PlacementOrderDetails | null;
  reduceMotion?: boolean;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export function ExtremeOrderPlacementModal({
  isOpen,
  onClose,
  order,
  reduceMotion = false,
}: ExtremeOrderPlacementModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // IMPORTANT: Per milestone requirements, this modal does NOT auto-dismiss.
    // It remains on-screen until manually closed by the user.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const totalValue = order.quantity * order.price;
  const { isPending, label: statusLabel } = formatExtremeStatusLabel(order.status);
  const dialogue = getExtremeOrderDialogue(order.orderId, order.dialogueIndex);

  return (
    <div
      className={`modal-backdrop extreme-placement-backdrop ${reduceMotion ? "reduced-motion" : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-card extreme-placement-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="extreme-placement-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="icon-button extreme-placement-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close order placement celebration"
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
          <ShadowCat expression={isPending ? "suspicious" : "profit"} size={76} />
        </div>

        <div className="celebration-header">
          <span className="celebration-eyebrow">
            SHADOW CAT EXTREME · ORDER #{order.orderId}
          </span>
          <h2 id="extreme-placement-title">
            {isPending ? (
              <>
                ORDER DISPATCHED.<br />
                <em>RESTING IN THE BOOK.</em>
              </>
            ) : (
              <>
                OFFERING ACCEPTED.<br />
                <em>EXECUTION CONFIRMED.</em>
              </>
            )}
          </h2>
        </div>

        <div className="extreme-status-badge-row">
          <span
            className={`extreme-status-pill ${
              isPending ? "is-pending" : "is-filled"
            }`}
          >
            {isPending ? <Clock size={12} /> : <CheckCircle2 size={12} />}
            <span>STATUS: {statusLabel}</span>
          </span>
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
            <span>QUANTITY</span>
            <strong>{order.quantity} shares</strong>
          </div>
          <div className="ticket-col">
            <span>LIMIT PRICE</span>
            <strong>{money(order.price)}</strong>
          </div>
          <div className="ticket-col">
            <span>TOTAL VALUE</span>
            <strong className="celebration-value">{money(totalValue)}</strong>
          </div>
        </div>

        <div className="extreme-cat-speech-bubble">
          <span className="speech-tag">SHADOW CAT SAYS</span>
          <p className="speech-quote">“{dialogue}”</p>
        </div>

        <div className="extreme-modal-actions">
          <button
            type="button"
            className="celebration-action-btn"
            onClick={onClose}
          >
            <span>Dismiss &amp; Continue Trading</span>
          </button>
        </div>
      </div>
    </div>
  );
}
