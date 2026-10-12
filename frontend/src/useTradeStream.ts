import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { getWebSocketUrl, validatePublicTrade, type PublicTradeResponse } from "./api.ts";

export type StreamStatus = "CONNECTED" | "CONNECTING" | "RECONNECTING" | "DISCONNECTED";

export interface UseTradeStreamResult {
  trades: PublicTradeResponse[];
  status: StreamStatus;
  connected: boolean;
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

export function useTradeStream(): UseTradeStreamResult {
  const [trades, setTrades] = useState<PublicTradeResponse[]>([]);
  const [status, setStatus] = useState<StreamStatus>("CONNECTING");
  const clientRef = useRef<Client | null>(null);

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
