import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { LocalOrder } from "../api";

interface ActivityViewProps {
  orders: LocalOrder[];
  onCancelOrder: (order: LocalOrder) => Promise<void>;
  onRefresh: () => void;
  isLoading: boolean;
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function ActivityView({
  orders,
  onCancelOrder,
  onRefresh,
  isLoading,
}: ActivityViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const pendingCount = orders.filter((o) => o.status === "PENDING" || o.status === "PARTIALLY_FILLED").length;
  const filledCount = orders.filter((o) => o.status === "FILLED").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "PENDING") return o.status === "PENDING" || o.status === "PARTIALLY_FILLED";
    return o.status === filterStatus;
  });

  return (
    <section className="activity-view">
      <div className="activity-summary-grid">
        <article className="portfolio-metric">
          <span>TOTAL ORDERS</span>
          <strong>{orders.length.toString().padStart(2, "0")}</strong>
          <small>Lifetime demo orders</small>
        </article>
        <article className="portfolio-metric">
          <span>OPEN / RESTING</span>
          <strong className="positive">{pendingCount.toString().padStart(2, "0")}</strong>
          <small>Active in order book</small>
        </article>
        <article className="portfolio-metric">
          <span>FILLED TRADES</span>
          <strong>{filledCount.toString().padStart(2, "0")}</strong>
          <small>Settled transactions</small>
        </article>
        <article className="portfolio-metric">
          <span>CANCELLED</span>
          <strong className="muted-number">{cancelledCount.toString().padStart(2, "0")}</strong>
          <small>Withdrawn orders</small>
        </article>
      </div>

      <section className="panel activity-table-panel">
        <div className="panel-topline">
          <div className="panel-label">
            <span className="panel-index">02</span> COMPLETE ORDER HISTORY ({filteredOrders.length})
          </div>
          <div className="activity-controls">
            <div className="status-filter-pills" role="radiogroup" aria-label="Filter orders by status">
              {["ALL", "PENDING", "FILLED", "CANCELLED"].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`status-pill ${filterStatus === status ? "is-active" : ""}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                  {status === "PENDING" && pendingCount > 0 && (
                    <span className="pill-badge">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="subtle-button refresh-act-btn"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh order history"
            >
              <span>Refresh</span>
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="activity-full-table">
          <div className="activity-table-head">
            <span>ORDER</span>
            <span>SIDE</span>
            <span>INSTRUMENT</span>
            <span>QUANTITY</span>
            <span>LIMIT PRICE</span>
            <span>STATUS</span>
            <span>TIMESTAMP</span>
            <span>ACTION</span>
          </div>

          {filteredOrders.map((order) => (
            <div className="activity-row full-activity-row" key={order.id}>
              <span className="order-id">#{order.id}</span>
              <span className={`activity-side ${order.side.toLowerCase()}`}>{order.side}</span>
              <strong>{order.symbol}</strong>
              <span>{order.quantity}</span>
              <span>{money(order.price)}</span>
              <span className="status-cell">
                <i className={`status-indicator ${order.status.toLowerCase()}`} />
                {order.status}
              </span>
              <span className="activity-time">{order.time}</span>
              <span className="action-cell">
                {(order.status === "PENDING" || order.status === "PARTIALLY_FILLED") ? (
                  <button
                    className="cancel-order-button"
                    onClick={() => void onCancelOrder(order)}
                    aria-label={`Cancel order #${order.id}`}
                    title="Cancel open order"
                  >
                    CANCEL
                  </button>
                ) : (
                  <span className="action-na">—</span>
                )}
              </span>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="empty-state">
              {orders.length === 0
                ? "No orders have been submitted on this demo account yet."
                : `No orders match filter “${filterStatus}”.`}
            </div>
          )}
        </div>

        <div className="activity-footer-note">
          <span>ORDERS CONFIRMED AND SYNCHRONIZED ACROSS POSTGRES DATABASE AND IN-MEMORY ORDER BOOK</span>
        </div>
      </section>
    </section>
  );
}
