import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { getWebSocketUrl, validatePublicTrade, type PublicTradeResponse } from "./api.ts";

export type StreamStatus = "CONNECTED" | "CONNECTING" | "RECONNECTING" | "DISCONNECTED";

export interface UseTradeStreamResult {
  trades: PublicTradeResponse[];
  status: StreamStatus;
  connected: boolean;
}

export interface UseTradeStreamOptions {
  onTrade?: (trade: PublicTradeResponse) => void;
}

export const MAX_TRADES = 30;

export function updateRecentTrades(
  current: PublicTradeResponse[],
  newTrade: PublicTradeResponse,
  max: number = MAX_TRADES
): PublicTradeResponse[] {
  // Deduplicate by tradeId
  if (current.some((existing) => existing.tradeId === newTrade.tradeId)) {
    return current;
  }
  // Prepend newest trade and retain at most max items
  return [newTrade, ...current].slice(0, max);
}

export interface TradeRefreshCoalescerOptions {
  debounceMs?: number;
  refresh: () => Promise<void>;
  onError?: (err: unknown) => void;
}

export interface TradeRefreshCoalescer {
  schedule: () => void;
  cancel: () => void;
  dispose: () => void;
  isRefreshing: () => boolean;
  isQueued: () => boolean;
  isDisposed: () => boolean;
}

export function createTradeRefreshCoalescer(options: TradeRefreshCoalescerOptions): TradeRefreshCoalescer {
  const debounceMs = options.debounceMs ?? 100;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let queued = false;
  let disposed = false;

  const execute = async () => {
    if (disposed) return;
    if (inFlight) {
      queued = true;
      return;
    }

    inFlight = true;
    try {
      await options.refresh();
    } catch (err) {
      options.onError?.(err);
    } finally {
      inFlight = false;
      if (!disposed && queued) {
        queued = false;
        void execute();
      }
    }
  };

  const schedule = () => {
    if (disposed) return;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      void execute();
    }, debounceMs);
  };

  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    queued = false;
  };

  const dispose = () => {
    disposed = true;
    cancel();
  };

  return {
    schedule,
    cancel,
    dispose,
    isRefreshing: () => inFlight,
    isQueued: () => queued,
    isDisposed: () => disposed,
  };
}

export function useTradeRefresh(
  refresh: () => Promise<void>,
  debounceMs: number = 100
): { scheduleRefresh: () => void; cancelRefresh: () => void } {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const coalescerRef = useRef<TradeRefreshCoalescer | null>(null);

  if (!coalescerRef.current) {
    coalescerRef.current = createTradeRefreshCoalescer({
      debounceMs,
      refresh: () => refreshRef.current(),
      onError: (err) => console.warn("Trade refresh error:", err),
    });
  }

  useEffect(() => {
    return () => {
      coalescerRef.current?.dispose();
    };
  }, []);

  const scheduleRefresh = useCallback(() => {
    coalescerRef.current?.schedule();
  }, []);

  const cancelRefresh = useCallback(() => {
    coalescerRef.current?.cancel();
  }, []);

  return { scheduleRefresh, cancelRefresh };
}

export function useTradeStream(options?: UseTradeStreamOptions): UseTradeStreamResult {
  const [trades, setTrades] = useState<PublicTradeResponse[]>([]);
  const [status, setStatus] = useState<StreamStatus>("CONNECTING");
  const clientRef = useRef<Client | null>(null);
  const onTradeRef = useRef(options?.onTrade);
  onTradeRef.current = options?.onTrade;

  useEffect(() => {
    let unmounted = false;
    let terminalError = false;
    const wsUrl = getWebSocketUrl();

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (unmounted) return;
        terminalError = false;
        setStatus("CONNECTED");

        client.subscribe("/topic/trades", (message) => {
          if (unmounted) return;
          try {
            const raw: unknown = JSON.parse(message.body);
            const validated = validatePublicTrade(raw);
            if (!validated) {
              console.warn("Discarded invalid trade payload from WebSocket feed");
              return;
            }

            setTrades((current) => updateRecentTrades(current, validated, MAX_TRADES));

            if (onTradeRef.current) {
              try {
                onTradeRef.current(validated);
              } catch (err) {
                console.error("Error in onTrade handler:", err);
              }
            }
          } catch (err) {
            console.error("Failed to parse incoming WebSocket message body:", err);
          }
        });
      },
      onDisconnect: () => {
        if (!unmounted) setStatus("DISCONNECTED");
      },
      onWebSocketClose: () => {
        if (!unmounted && !terminalError) setStatus("RECONNECTING");
      },
      onStompError: (frame) => {
        console.error("STOMP broker error:", frame.headers["message"]);
        terminalError = true;
        if (!unmounted) setStatus("DISCONNECTED");
      },
      onWebSocketError: (event) => {
        console.warn("WebSocket connection error:", event);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      unmounted = true;
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, []);

  return {
    trades,
    status,
    connected: status === "CONNECTED",
  };
}
